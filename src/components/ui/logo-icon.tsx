interface LogoIconProps {
  className?: string
  style?: React.CSSProperties
}

export default function LogoIcon({ className, style }: LogoIconProps) {
  return (
    <svg
      width="70"
      height="70"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M30 30H10V10H30V30ZM19.4463 11.25C19.1886 12.7675 18.7891 13.9508 18.1279 14.9785C17.3154 16.2415 16.2415 17.3154 14.9785 18.1279C13.9508 18.789 12.7674 19.1877 11.25 19.4453V20.5537C12.7675 20.8114 13.9508 21.2109 14.9785 21.8721C16.2415 22.6846 17.3154 23.7585 18.1279 25.0215C18.7889 26.049 19.1886 27.232 19.4463 28.749H20.5537C20.8114 27.232 21.2111 26.049 21.8721 25.0215C22.6846 23.7585 23.7585 22.6846 25.0215 21.8721C26.049 21.2111 27.232 20.8114 28.749 20.5537V19.4453C27.232 19.1877 26.049 18.7889 25.0215 18.1279C23.7585 17.3154 22.6846 16.2415 21.8721 14.9785C21.2109 13.9508 20.8114 12.7675 20.5537 11.25H19.4463Z"
        style={{ fill: "#707070a7" }}
        fillOpacity="0.5"
      />
      <circle
        cx="36.25"
        cy="20"
        r="2.5"
        fill="#FF7F42"
        style={{ fill: "#FF7F42", fillOpacity: 1 }}
      />
      <circle
        cx="3.75"
        cy="20"
        r="2.5"
        //blu
        style={{ fill: "#517FEB", fillOpacity: 1 }}
      />
      <circle
        cx="20"
        cy="3.75"
        r="2.5"
        fill="#7CC06C"
        style={{ fill: "#7CC06C", fillOpacity: 1 }}
      />
      <circle
        cx="20"
        cy="36.25"
        r="2.5"
        fill="#CC3E79"
        style={{ fill: "#CC3E79", fillOpacity: 1 }}
      />
    </svg>
  )
}
