const BasicHero = ({ title, description }: { title: string, description: string }) => {
  return (
    <section className="bg-gray-300 text-black">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mb-0">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}

export default BasicHero