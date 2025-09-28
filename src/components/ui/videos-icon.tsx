interface VideosIconProps {
  className?: string
  style?: React.CSSProperties
}

export default function VideosIcon({ className, style }: VideosIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <g opacity="currentOpacity">
        <path
          d="M12 2C13.845 2 15.33 2 16.54 2.088L13.1 7.25H8.4L11.9 2H12ZM3.464 3.464C4.717 2.212 6.622 2.031 10.096 2.004L6.599 7.25H2.104C2.251 5.486 2.607 4.322 3.464 3.464Z"
          fill="currentColor"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M2 12C2 10.763 2 9.689 2.026 8.75H21.974C22 9.689 22 10.763 22 12C22 16.714 22 19.071 20.535 20.535C19.072 22 16.714 22 12 22C7.286 22 4.929 22 3.464 20.535C2 19.072 2 16.714 2 12ZM13.014 12.585C14.338 13.44 15 13.867 15 14.5C15 15.133 14.338 15.56 13.014 16.415C11.672 17.281 11.001 17.714 10.5 17.395C10 17.078 10 16.219 10 14.5C10 12.781 10 11.922 10.5 11.604C11 11.286 11.672 11.719 13.014 12.585Z"
          fill="currentColor"
        />
        <path
          d="M21.896 7.24996C21.749 5.48596 21.393 4.32196 20.536 3.46396C19.938 2.86696 19.192 2.51396 18.199 2.30396L14.9 7.24996H21.896Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
