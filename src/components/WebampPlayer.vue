<template>
  <div ref="webampContainer" class="webamp-container"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from "vue";

export default {
  name: "WebampPlayer",
  props: {
    isVisible: Boolean,
  },
  emits: ["close"],
  setup(props, { emit }) {
    const webampContainer = ref(null);
    let webampInstance = null;

    const initWebamp = () => {
      if (webampInstance) return;

      const tracks = [
        {
          metaData: {
            artist: "Souls of Mischief",
            title: "93 Til Infinity (Youandewan Remix)",
          },
          url: "/tunes/youandewan.mp3",
          duration: 301,
        },
        {
          metaData: {
            artist: "Jamie xx",
            title: "Sleep Sound",
          },
          url: "/tunes/jamiexx.mp3",
          duration: 384,
        },
        {
          metaData: {
            artist: "Big Wild",
            title: "6's to 9's (feat. Rationale) [Day Wave Remix]",
          },
          url: "/tunes/6sto9s.mp3",
          duration: 165,
        },
        {
          metaData: {
            artist: "Nice & Smooth",
            title: "Sometimes I Rhyme Slow",
          },
          url: "/tunes/slow.mp3",
          duration: 170,
        },
        {
          metaData: {
            artist: "Nickleback",
            title: "Savin' Me",
          },
          url: "/tunes/savin.mp3",
          duration: 217,
        },
        // Add more tracks as needed
      ];

      import("webamp")
        .then((WebampModule) => {
          const Webamp = WebampModule.default;

          webampInstance = new Webamp({
            initialTracks: tracks,
          });

          webampInstance.onClose(() => {
            emit("close");
          });

          webampInstance.renderWhenReady(webampContainer.value).then(() => {
            // Position windows after rendering
            const screenWidth = window.innerWidth;

            webampInstance.store.dispatch({
              type: "UPDATE_WINDOW_POSITIONS",
              positions: {
                main: { x: screenWidth - 275, y: 0 },
                equalizer: { x: screenWidth - 275, y: 116 },
                playlist: { x: screenWidth - 275, y: 232 },
                milkdrop: { x: screenWidth - 975, y: 0 },
              },
            });

            // Set the size of the milkdrop window
            webampInstance.store.dispatch({
              type: "UPDATE_WINDOW_SIZE",
              windowId: "milkdrop",
              size: [700, 600],
            });

            // Start playing the first track
            webampInstance.play();
          });
        })
        .catch((error) => {
          console.error("Error initializing Webamp:", error);
        });
    };

    const destroyWebamp = () => {
      if (webampInstance) {
        webampInstance.dispose();
        webampInstance = null;
      }
    };

    watch(
      () => props.isVisible,
      (newValue) => {
        if (newValue) {
          initWebamp();
        } else {
          destroyWebamp();
        }
      }
    );

    onMounted(() => {
      if (props.isVisible) {
        initWebamp();
      }
    });

    onUnmounted(() => {
      destroyWebamp();
    });

    return {
      webampContainer,
    };
  },
};
</script>

<style scoped>
.webamp-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
}
</style>
