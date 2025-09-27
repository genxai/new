export default function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_11_347)">
        <path
          d="M7 0C7.55228 0 8 0.447715 8 1V5H12C12.5523 5 13 5.44772 13 6C13 6.55228 12.5523 7 12 7H8V11C8 11.5523 7.55228 12 7 12C6.44772 12 6 11.5523 6 11V7H2C1.44772 7 1 6.55228 1 6C1 5.44772 1.44772 5 2 5H6V1C6 0.447715 6.44772 0 7 0Z"
          fill="currentColor"
          fill-opacity="0.75"
          shape-rendering="crispEdges"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_11_347"
          x="0.5"
          y="0"
          width="13"
          height="13.25"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="0.75" />
          <feGaussianBlur stdDeviation="0.25" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_11_347"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_11_347"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_11_347"
          x1="7"
          y1="0"
          x2="7"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: "black", stopOpacity: 1 }} />
          <stop
            offset="1"
            stop-opacity="0.4"
            style={{ stopColor: "black", stopOpacity: 0.4 }}
          />
        </linearGradient>
      </defs>
    </svg>
  )
}
