<template>
  <div class="mountain-biker-animation">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: #ff6b6b; stop-opacity: 1">
            <animate
              attributeName="stop-color"
              values="#FF6B6B;#22223B;#FF6B6B"
              dur="20s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" style="stop-color: #fca3b7; stop-opacity: 1">
            <animate
              attributeName="stop-color"
              values="#FCA3B7;#4A4E69;#FCA3B7"
              dur="20s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" style="stop-color: #ffd93d; stop-opacity: 1">
            <animate
              attributeName="stop-color"
              values="#FFD93D;#9A8C98;#FFD93D"
              dur="20s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>

      <!-- Sky -->
      <rect width="800" height="600" fill="url(#skyGradient)" />

      <!-- Sun -->
      <circle cx="400" cy="150" r="60" fill="#FF6B6B">
        <animate
          attributeName="cy"
          values="150;600;150"
          dur="20s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fill"
          values="#FF6B6B;#FFD93D;#FF6B6B"
          dur="20s"
          repeatCount="indefinite"
        />
      </circle>

      <!-- Mountains -->
      <polygon points="0,600 300,200 600,600" fill="#4A4E69" />
      <polygon points="400,600 700,300 800,600" fill="#22223B" />

      <!-- Ground -->
      <rect x="0" y="500" width="800" height="100" fill="#22223B" />

      <!-- Trail -->
      <path
        d="M0,550 Q400,500 800,550"
        stroke="#9A8C98"
        stroke-width="4"
        fill="none"
      />

      <!-- Biker -->
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          from="-100,450"
          to="900,450"
          dur="10s"
          repeatCount="indefinite"
        />
        <g transform="scale(0.5)">
          <!-- Bike frame -->
          <path
            d="M10,80 L80,80 L65,40 L10,80 Z"
            stroke="#F2E9E4"
            stroke-width="4"
            fill="none"
          />
          <line
            x1="65"
            y1="40"
            x2="90"
            y2="80"
            stroke="#F2E9E4"
            stroke-width="4"
          />

          <!-- Wheels -->
          <circle
            cx="10"
            cy="80"
            r="20"
            stroke="#F2E9E4"
            stroke-width="4"
            fill="none"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 10 80"
              to="360 10 80"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="90"
            cy="80"
            r="20"
            stroke="#F2E9E4"
            stroke-width="4"
            fill="none"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 90 80"
              to="360 90 80"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>

          <!-- Rider -->
          <circle cx="50" cy="30" r="10" fill="#F2E9E4" />
          <!-- Head -->
          <line
            x1="50"
            y1="40"
            x2="50"
            y2="60"
            stroke="#F2E9E4"
            stroke-width="4"
          />
          <!-- Body -->
          <line
            x1="50"
            y1="60"
            x2="80"
            y2="80"
            stroke="#F2E9E4"
            stroke-width="4"
          >
            <!-- Leg -->
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 50 60;-20 50 60;0 50 60"
              dur="1s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="50"
            y1="45"
            x2="70"
            y2="55"
            stroke="#F2E9E4"
            stroke-width="4"
          >
            <!-- Arm -->
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 50 45;-10 50 45;0 50 45"
              dur="1s"
              repeatCount="indefinite"
            />
          </line>
        </g>
      </g>

      <!-- Trees -->
      <g transform="translate(100, 450) scale(0.7)">
        <polygon points="0,50 25,0 50,50" fill="#355E3B">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;0,-5;0,0"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>
        <rect x="20" y="50" width="10" height="20" fill="#22223B" />
      </g>
      <g transform="translate(650, 470) scale(0.5)">
        <polygon points="0,50 25,0 50,50" fill="#355E3B">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;0,-3;0,0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </polygon>
        <rect x="20" y="50" width="10" height="20" fill="#22223B" />
      </g>
    </svg>
    <button class="close-button" @click="closeAnimation">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: "MountainBikerAnimation",
  methods: {
    closeAnimation() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.mountain-biker-animation {
  width: 100%;
  height: 100%;
  min-height: 300px; /* Adjust as needed */
  position: relative;
}

svg {
  width: 100%;
  height: 100%;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.close-button svg {
  width: 24px;
  height: 24px;
  stroke: #333;
}
</style>
