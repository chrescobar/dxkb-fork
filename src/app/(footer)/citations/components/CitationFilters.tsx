"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicationType, SortOption } from "../data/types";

interface CitationFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  typeFilter: PublicationType;
  setTypeFilter: (type: PublicationType) => void;
  uniqueYears: number[];
}

export function CitationFilters({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  typeFilter,
  setTypeFilter,
  uniqueYears,
}: CitationFiltersProps) {
  return (
    <div className="citation-filters">
      <div className="citation-search">
        <Search className="citation-search-icon" />
        <Input
          placeholder="Search citations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="citation-search-input"
        />
      </div>

      <div className="citation-filters-grid">
        <Select
          items={[
            { value: "newest", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "highest-impact", label: "Highest Impact" },
            { value: "most-cited", label: "Most Cited" },
          ]}
          value={sortOption}
          onValueChange={(value) => value != null && setSortOption(value as SortOption)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest-impact">Highest Impact</SelectItem>
              <SelectItem value="most-cited">Most Cited</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "All", label: "All Types" },
            { value: "Journal Article", label: "Journal Articles" },
            { value: "Conference Paper", label: "Conference Papers" },
            { value: "Book Chapter", label: "Book Chapters" },
          ]}
          value={typeFilter}
          onValueChange={(value) => value != null && setTypeFilter(value as PublicationType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Publication Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Journal Article">Journal Articles</SelectItem>
              <SelectItem value="Conference Paper">Conference Papers</SelectItem>
              <SelectItem value="Book Chapter">Book Chapters</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "all", label: "All Years" },
            ...uniqueYears.map((year) => ({ value: String(year), label: String(year) })),
          ]}
          value={String(uniqueYears[0])}
          onValueChange={() => {}}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 