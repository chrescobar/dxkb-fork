import { SearchBar } from "@/components/search/search-bar";
import ThemeContent from "@/components/ui/theme-content";

const WelcomeHero = () => {
  return (
    <section className="py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">Welcome to the</h1>
      <h2 className="mb-8 text-3xl font-bold">
        <ThemeContent type="site-name" as="span" />
      </h2>
      <SearchBar />
    </section>
  )
}

export default WelcomeHero;