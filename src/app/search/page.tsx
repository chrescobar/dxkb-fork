"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LuUser, LuMail, LuHash, LuFileText } from "react-icons/lu";

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

export default function SearchResultsPage() {
  const [searchResults, setSearchResults] = useState<Comment[]>([]);
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get query from URL
    const urlQuery = searchParams.get("q") || "";
    setQuery(urlQuery);

    // Get results from sessionStorage
    try {
      const storedResults = sessionStorage.getItem("searchResults");
      const storedQuery = sessionStorage.getItem("searchQuery");

      if (storedResults && storedQuery === urlQuery) {
        setSearchResults(JSON.parse(storedResults));
      } else if (urlQuery) {
        // If URL has a query but no cached results, fetch them
        fetchSearchResults(urlQuery);
      }
    } catch (error) {
      console.error("Error loading search results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchSearchResults = async (searchQuery: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/comments`,
      );
      const data: Comment[] = await response.json();
      const results = data.filter(
        (comment) =>
          comment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comment.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setSearchResults(results);
      sessionStorage.setItem("searchResults", JSON.stringify(results));
      sessionStorage.setItem("searchQuery", searchQuery);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Search Results</h1>
        <p className="text-gray-600">
          {isLoading
            ? "Loading results..."
            : `Found ${searchResults.length} results for "${query}"`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="mb-4 text-2xl font-medium">No results found</h2>
          <p className="text-gray-600">Try different search terms or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {searchResults.map((result) => (
            <Card key={result.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <LuHash className="text-primary" />
                  <span>Comment #{result.id}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <LuUser className="text-gray-500" />
                  <span className="font-medium">{result.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                  <LuMail className="shrink-0" />
                  <span>{result.email}</span>
                </div>
                <div className="flex gap-2">
                  <LuFileText className="mt-1 shrink-0 text-gray-500" />
                  <p className="text-gray-700">{result.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
