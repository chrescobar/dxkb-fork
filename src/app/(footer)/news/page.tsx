import React from "react";
import FooterHeader from "@/components/headers/footer-header";
import Image from "next/image";
import Link from "next/link";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
}

interface NewsCardProps extends NewsItem {
  isLarge?: boolean;
}

// Mock data - replace with actual data later
const topStories: NewsItem[] = [
  {
    id: 1,
    title: "Measles Cases and Outbreaks",
    description: "As of March 27, 2025, a total of 483 confirmed* measles cases were reported by 20 jurisdictions: Alaska, California, Florida, Georgia, Kansas, Kentucky, Maryland, Michigan, Minnesota, New Jersey, New Mexico, New York City, New York State, Ohio, Pennsylvania, Rhode Island, Tennessee, Texas, Vermont, and Washington.",
    image: "https://www.cdc.gov/measles/media/images/Measles-World-Map-Travel.jpg",
    link: "https://www.cdc.gov/measles/data-research/index.html#cdc_data_surveillance_section_10-measles-cases-in-2025",
  },
  {
    id: 2,
    title: "MONSTER Bird Flu Update: Unprecedented Mammal-to-Mammal Transmission Confirmed",
    description: "Mammal-to-mammal gain-of-function — the newfound ability to transmit between mammals — has always seemed inevitable, given that the biomedical security state is literally funding gain-of-function research on viruses in clandestine labs all over the world, fully immune from oversight.",
    image: "https://media.townhall.com/cdn/hodl/2018/221/61b03a15-3bcd-4c49-8f5d-f8d47a97f7a3-1052x615.jpg",
    link: "https://pjmedia.com/benbartee/2025/03/18/monster-bird-flu-update-unprecedented-mammal-to-mammal-transmission-confirmed-n4938014",
  }
];

const moreNews: NewsItem[] = [
  {
    id: 3,
    title: "Influenza A viruses adapt shape in response to environmental pressures",
    description: "NIH study identifies previously unknown adaptation.",
    image: "https://www.nih.gov/sites/default/files/styles/featured_media_breakpoint-large-extra/public/news-events/news-releases/2025/20250210-h3n2.jpg?itok=1zFjjepa&timestamp=1739224613",
    link: "https://www.nih.gov/news-events/news-releases/influenza-viruses-adapt-shape-response-environmental-pressures",
  },
  {
    id: 4,
    title: "NASA’s SPHEREx Takes First Images, Preps to Study Millions of Galaxies",
    description: "Processed with rainbow hues to represent a range of infrared wavelengths, the new pictures indicate the astrophysics space observatory is working as expected.",
    image: "https://d2pn8kiwq2w21t.cloudfront.net/images/1-PIA26280-SPHEREx-cropped.width-1320.jpg",
    link: "https://www.jpl.nasa.gov/news/nasas-spherex-takes-first-images-preps-to-study-millions-of-galaxies/",
  },
  {
    id: 5,
    title: "Close Relative of Highly Fatal Coronavirus Discovered in Brazil's Bats",
    description: "Brazil's bats are harboring a vast and diverse pool of coronaviruses, a new study finds, including a newly identified strain that may pose a danger to human health in the years to come.",
    image: "https://www.sciencealert.com/images/2025/03/MMolossus.jpg",
    link: "https://www.sciencealert.com/close-relative-of-highly-fatal-coronavirus-discovered-in-brazils-bats#",
  },
];

const NewsCard = ({ title, description, image, link, isLarge = false }: NewsCardProps) => (
  <Link href={link} className="news-card group">
    <div className={`relative ${isLarge ? "h-48 sm:h-64" : "h-32 sm:h-40"}`}>
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="news-card-content">
      <h3 className="font-semibold text-dxkb-blue transition-colors group-hover:text-dxkb-orange">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>
    </div>
  </Link>
);

const News = () => {
  return (
    <div className="flex w-full flex-col items-center">
      <FooterHeader title="Community News" />

      <div className="news-container">
        {/* Top Stories */}
        <section>
          <h2 className="news-section-title">Top Stories</h2>
          <div className="news-grid-top">
            {topStories.map((story) => (
              <NewsCard key={story.id} {...story} isLarge={true} />
            ))}
          </div>
        </section>

        {/* More News */}
        <section className="my-24">
          <h2 className="news-section-title">In Other News...</h2>
          <div className="news-grid-more">
            {moreNews.map((story) => (
              <NewsCard key={story.id} {...story} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default News;
