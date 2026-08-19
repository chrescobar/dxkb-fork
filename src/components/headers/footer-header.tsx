interface FooterHeaderProps {
  title: string
}

const FooterHeader = ({ title }: FooterHeaderProps) => {
  return (
    <div
        id="title-header"
        className="flex h-32 w-full items-center justify-center rounded-b-xl bg-gradient-to-b from-primary to-background text-white md:h-48"
      >
        <h1 id="title" className="text-center text-2xl font-bold md:text-4xl">
          {title}
        </h1>
      </div>
  )
}

export default FooterHeader