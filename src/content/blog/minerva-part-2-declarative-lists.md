---
title: "Minerva: Kill Your Imperative List Code"
date: 2019-03-22
description: Part 2: CellModels turn iOS list management from imperative data source manipulation into declarative state descriptions.
tags: ios, minerva, declarative-ui, swift
series: Minerva Deep Dive
part: 2
---

# Minerva: Kill Your Imperative List Code

In [Part 1](/blog/minerva-part-1-coordinators-and-lists) I covered Minerva's Coordinator architecture: how it manages view controller lifecycles and navigation. The structural half of the framework. This post covers the other half: how Minerva turns list management from an imperative headache into a declarative system.

The core idea is simple. Instead of telling UICollectionView what to insert, delete, and move, you describe what the list should look like. Minerva diffs the old state against the new state and applies the minimal set of changes. You've probably seen this idea before if you've used React or Flutter (which [hit 1.0 last December](https://developers.googleblog.com/en/flutter-10-googles-portable-ui-toolkit/)). Instagram's [IGListKit](https://github.com/Instagram/IGListKit) brought efficient diffing to iOS collection views, and Minerva builds on top of it to provide the full architecture layer above.

## The Problem with Imperative Lists

Every iOS developer has written code like this:

```swift
func addItem(_ item: Item) {
    items.append(item)
    let indexPath = IndexPath(row: items.count - 1, section: 0)
    tableView.insertRows(at: [indexPath], with: .automatic)
}

func removeItem(at index: Int) {
    items.remove(at: index)
    let indexPath = IndexPath(row: index, section: 0)
    tableView.deleteRows(at: [indexPath], with: .automatic)
}

func updateItem(_ item: Item, at index: Int) {
    items[index] = item
    let indexPath = IndexPath(row: index, section: 0)
    tableView.reloadRows(at: [indexPath], with: .automatic)
}
```

This code has bugs. Not obviously. It works for simple cases. But batch it inside `performBatchUpdates`, add multiple sections, handle concurrent data loads, throw in some user-initiated reordering, and you'll spend a week debugging `NSInternalInconsistencyException: Invalid update`.

The fundamental issue is that you're maintaining two sources of truth (your data model and the table view's internal state) and manually keeping them in sync through imperative commands. Every mutation is a potential inconsistency.

## CellModel: The Core Abstraction

Minerva's `ListCellModel` protocol is the answer. A cell model is a declarative description of what a single cell should look like and how it should behave:

```swift
public protocol ListCellModel {
    var identifier: String { get }
    var cellType: ListCollectionViewCell.Type { get }
    func identical(to model: ListCellModel) -> Bool
    func size(constrainedTo containerSize: CGSize) -> ListCellSize
}
```

Four requirements:

- **`identifier`:** A stable, unique identity for this cell. If two models have different identifiers, Minerva treats them as completely different cells and animates a delete/insert. If they have the same identifier, Minerva checks `identical` to see if the content changed.
- **`cellType`:** The `UICollectionViewCell` subclass this model binds to. Minerva handles registration and dequeuing automatically.
- **`identical(to:)`:** Determines whether two models with the same identifier have the same content. If they're not identical, the cell gets reloaded with the new model. If they are identical, nothing happens.
- **`size(constrainedTo:)`:** Returns the sizing strategy for this cell.

The sizing is worth pausing on. `ListCellSize` is an enum:

```swift
public enum ListCellSize: Equatable {
    case autolayout
    case explicit(size: CGSize)
    case relative
}
```

`.autolayout` means Minerva binds the model to an offscreen template cell and lets Auto Layout determine the size. Self-sizing cells, out of the box. `.explicit` is for when you know the exact size. `.relative` delegates to a size delegate for cases where the cell size depends on its siblings or the container.

## Building a Cell Model

Here's a concrete example. A cell model for a user row in a list:

```swift
struct UserCellModel: ListTypedCellModel, ListSelectableCellModel, Equatable {
    typealias CellType = UserCell
    typealias SelectableModelType = UserCellModel

    let identifier: String
    let name: String
    let email: String
    let avatarURL: URL?
    let selectionAction: SelectionAction?

    init(user: User, selectionAction: SelectionAction?) {
        self.identifier = "UserCell-\(user.id)"
        self.name = user.displayName
        self.email = user.email
        self.avatarURL = user.avatarURL
        self.selectionAction = selectionAction
    }

    func size(constrainedTo containerSize: CGSize) -> ListCellSize {
        .autolayout
    }

    // Closures can't be compared, so we exclude selectionAction
    // and compare only the data properties that affect rendering.
    static func == (lhs: UserCellModel, rhs: UserCellModel) -> Bool {
        lhs.identifier == rhs.identifier
            && lhs.name == rhs.name
            && lhs.email == rhs.email
            && lhs.avatarURL == rhs.avatarURL
    }
}
```

A few things to notice:

**`ListTypedCellModel`** adds type safety. It associates the model with a specific cell type through the `CellType` typealias, so binding is type-checked at compile time. It also provides a default implementation of `identical(to:)` for `Equatable` types. If the struct's properties haven't changed, the cell doesn't need updating.

**`ListSelectableCellModel`** makes the cell tappable. The `selectionAction` closure is called when the user taps the cell, receiving the strongly-typed model and the index path. No more `didSelectRowAt` switch statements.

**The model is a value type.** It's a struct, it's Equatable, it's completely inert. It doesn't know about UIKit, it doesn't hold references to views, it doesn't have side effects. It's a pure description of what a cell should contain.

## The Cell: Binding the Model

The corresponding cell implements `ListTypedCell`:

```swift
final class UserCell: ListCollectionViewCell, ListTypedCell {
    typealias ModelType = UserCellModel

    private let nameLabel = UILabel()
    private let emailLabel = UILabel()
    private let avatarView = UIImageView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) not supported")
    }

    func bind(model: UserCellModel, sizing: Bool) {
        nameLabel.text = model.name
        emailLabel.text = model.email
        guard !sizing else { return }
        avatarView.loadImage(from: model.avatarURL)
    }

    private func setupConstraints() {
        // Auto Layout setup...
    }
}
```

The `bind(model:sizing:)` method is the only connection between the model and the view. The `sizing` parameter is important: when Minerva is calculating cell sizes for autolayout, it passes `true` so you can skip expensive operations like image loading that don't affect layout.

## ListSection: Grouping Models

Cell models are grouped into sections:

```swift
public struct ListSection {
    public let identifier: String
    public var constraints: Constraints
    public var headerModel: ListCellModel?
    public var footerModel: ListCellModel?
    public var cellModels: [ListCellModel]

    public init(cellModels: [ListCellModel], identifier: String) {
        self.cellModels = cellModels
        self.identifier = identifier
    }
}
```

Like cell models, sections have stable identifiers. The `Constraints` struct controls layout:

```swift
public struct Constraints: Hashable {
    public var inset: UIEdgeInsets = .zero
    public var minimumLineSpacing: CGFloat = 0
    public var minimumInteritemSpacing: CGFloat = 0
    public var distribution: Distribution = .entireRow
    public var scrollDirection: UICollectionView.ScrollDirection = .vertical
}
```

The `Distribution` enum is where Minerva's layout system shines:

```swift
public enum Distribution: Hashable {
    case entireRow          // Cell takes the full width
    case equally(cellsInRow: Int)  // N cells per row, equally sized
    case proportionally     // Cells size themselves, flow naturally
    case proportionallyWithLastCellFillingWidth(minimumWidth: CGFloat)
}
```

This replaces the `UICollectionViewDelegateFlowLayout` dance. Instead of implementing `sizeForItemAt` and doing math to figure out how wide a cell should be for a 2-column grid, you set `.equally(cellsInRow: 2)` and move on.

## Putting It Together: Declarative List State

Here's a coordinator method that builds a complete list state:

```swift
func updateUI(with user: User, posts: [Post]) {
    var sections: [ListSection] = []

    // Profile section
    let profileModel = ProfileHeaderCellModel(user: user)
    let statsModel = UserStatsCellModel(
        followers: user.followerCount,
        following: user.followingCount
    )
    var profileSection = ListSection(
        cellModels: [profileModel, statsModel],
        identifier: "profile"
    )
    profileSection.constraints.inset = UIEdgeInsets(top: 16, left: 16, bottom: 8, right: 16)
    sections.append(profileSection)

    // Posts section
    let postModels: [ListCellModel] = posts.map { post in
        PostCellModel(post: post) { [weak self] model, _ in
            self?.showPostDetail(model.postId)
        }
    }
    var postsSection = ListSection(
        cellModels: postModels,
        identifier: "posts"
    )
    postsSection.constraints.minimumLineSpacing = 8
    postsSection.constraints.inset = UIEdgeInsets(top: 8, left: 16, bottom: 16, right: 16)
    sections.append(postsSection)

    // Apply to collection view
    listController.update(with: sections, animated: true)
}
```

That last line is the entire update. You don't compute what changed. You don't calculate index paths. You don't call `performBatchUpdates`. You hand Minerva the new list state, and it figures out the minimal set of animations to get from the old state to the new state.

Under the hood, Minerva uses IGListKit's diffing algorithm to compare the old and new sections by identifier, then compares cell models within each section. Same identifier + `identical` returns true = no change. Same identifier + `identical` returns false = reload. Different identifier = insert/delete with animation.

## The Declarative Shift

The mental model change is what matters most. With imperative list management, you think in terms of operations: "insert a row here, delete a row there, reload this section." With Minerva, you think in terms of state: "here's what the list should look like now."

This has downstream effects on your entire architecture:

**Data loading becomes simpler.** When the API returns new data, you rebuild the entire list state and call `update`. You don't need to diff the API response against your current state to figure out what changed. Minerva does that for you.

**Error states are trivial.** Want to show an error cell instead of a list of posts? Build a section with one error cell model and call `update`. The posts animate out, the error animates in.

**Loading states are trivial.** Replace your content models with skeleton cell models. Call `update`. When the real data arrives, replace the skeletons with content models. Call `update` again.

```swift
func showLoading() {
    let skeletonModels: [ListCellModel] = (0..<5).map { i in
        SkeletonCellModel(identifier: "skeleton-\(i)")
    }
    let section = ListSection(cellModels: skeletonModels, identifier: "content")
    listController.update(with: [section], animated: true)
}

func showContent(posts: [Post]) {
    let postModels: [ListCellModel] = posts.map { PostCellModel(post: $0) }
    let section = ListSection(cellModels: postModels, identifier: "content")
    listController.update(with: [section], animated: true)
}

func showError(_ error: Error) {
    let errorModel = ErrorCellModel(message: error.localizedDescription) { [weak self] _, _ in
        self?.retry()
    }
    let section = ListSection(cellModels: [errorModel], identifier: "content")
    listController.update(with: [section], animated: true)
}
```

All three methods follow the same pattern: build the state, apply it. The section identifier is "content" in all three cases, so Minerva smoothly animates between loading, content, and error states.

## Testing Cell Models

Because cell models are value types with no UIKit dependencies, they're trivially testable:

```swift
func testUserCellModelIdentity() {
    let user = User(id: "123", displayName: "Jeff", email: "jeff@example.com")
    let model1 = UserCellModel(user: user, selectionAction: nil)
    let model2 = UserCellModel(user: user, selectionAction: nil)

    XCTAssertEqual(model1.identifier, model2.identifier)
    XCTAssertTrue(model1.identical(to: model2))

    let updatedUser = User(id: "123", displayName: "Jeffrey", email: "jeff@example.com")
    let model3 = UserCellModel(user: updatedUser, selectionAction: nil)

    XCTAssertEqual(model1.identifier, model3.identifier) // Same user
    XCTAssertFalse(model1.identical(to: model3))          // Different content
}
```

No `XCUIApplication`, no `UICollectionView`, no waiting for animations. These tests run in milliseconds.

## What's Next

The CellModel and ListSection system handles the "what does this screen show" question. The approach mirrors what React's declarative rendering model does for the web, and what Flutter's widget tree does for cross-platform mobile. The difference is that Minerva targets UIKit, the platform that Apple's one billion iOS devices actually run today. There's no SwiftUI yet (though rumors of something declarative are swirling ahead of WWDC 2019 this June).

But iOS apps aren't just lists of content. They're graphs of screens connected by navigation. In Part 3, I'll cover how Minerva's Navigator protocol separates the mechanics of presentation from the logic of navigation, and why that separation makes deep linking almost trivial.

The source is at [github.com/MinervaMobile](https://github.com/MinervaMobile). The `MinervaExtensions` pod includes a library of pre-built cell models for common UI patterns (text cells, image cells, buttons, switches, separators) so you can get a list on screen without writing any custom cells.
