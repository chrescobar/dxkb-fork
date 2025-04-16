import React, { useState, FormEvent } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface WelcomeSearchProps {
  setSearchResults?: (results: Comment[]) => void;
}

const WelcomeSearch = ({ setSearchResults }: WelcomeSearchProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!inputValue.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/comments`,
      );
      const data: Comment[] = await response.json();
      const results = data.filter(
        (comment) =>
          comment.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          comment.body.toLowerCase().includes(inputValue.toLowerCase()) ||
          comment.email.toLowerCase().includes(inputValue.toLowerCase()),
      );

      if (setSearchResults) {
        setSearchResults(results);
      }

      // Store results in sessionStorage for the results page
      sessionStorage.setItem("searchResults", JSON.stringify(results));
      sessionStorage.setItem("searchQuery", inputValue);

      // Navigate to results page
      router.push(`/search?q=${encodeURIComponent(inputValue)}`);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="flex-grow">
      {/* Hero Section with Search */}
      <div className="from-primary-def to-background-50 bg-gradient-to-b py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Welcome to the Disease X Knowledge Base
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg font-normal text-gray-50">
            Access detailed information on viral genomes, proteins, and
            biological data to accelerate your research and discoveries.
          </p>

          {/* Search Interface */}
          <div className="mx-auto max-w-4xl">
            <div className="bg-background-50 rounded-lg p-6 shadow-lg">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Search</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
                  <TabsTrigger value="sequence">Sequence Search</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <form
                    onSubmit={handleSearch}
                    className="flex gap-2"
                    id="basic-search-bar"
                  >
                    <div className="relative flex-grow">
                      <Input
                        type="text"
                        placeholder="Search by virus name, protein, gene, or taxonomy..."
                        className="py-6 pl-10"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <LuSearch
                        className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
                        size={18}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-secondary-def hover:bg-secondary-def py-6"
                      disabled={isLoading}
                    >
                      {isLoading ? "Searching..." : "Search"}
                    </Button>
                  </form>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="mr-2 text-sm text-gray-500">
                      Popular searches:
                    </span>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-white"
                    >
                      SARS-CoV-2
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-white"
                    >
                      Influenza A
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-white"
                    >
                      HIV-1
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-white"
                    >
                      Ebola virus
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-white"
                    >
                      Zika virus
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="advanced">
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                        Taxonomy
                      </label>
                      <Input type="text" placeholder="e.g., Coronaviridae" />
                    </div>
                    <div>
                      <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                        Host
                      </label>
                      <Input type="text" placeholder="e.g., Homo sapiens" />
                    </div>
                    <div>
                      <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                        Genome Type
                      </label>
                      <Input type="text" placeholder="e.g., ssRNA(+)" />
                    </div>
                    <div>
                      <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                        Protein Function
                      </label>
                      <Input type="text" placeholder="e.g., Polymerase" />
                    </div>
                  </div>
                  <Button className="bg-secondary-def hover:bg-secondary-def w-full">
                    Submit Advanced Search
                  </Button>
                </TabsContent>

                <TabsContent value="sequence">
                  <div className="mb-4">
                    <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                      Sequence Type
                    </label>
                    <div className="mb-4 flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="nucleotide"
                          name="sequence-type"
                          className="mr-2"
                          defaultChecked
                        />
                        <label htmlFor="nucleotide">Nucleotide</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="protein"
                          name="sequence-type"
                          className="mr-2"
                        />
                        <label htmlFor="protein">Protein</label>
                      </div>
                    </div>

                    <label className="mb-1 block text-left text-sm font-medium text-gray-700">
                      Enter Sequence
                    </label>
                    <textarea
                      className="h-24 w-full rounded-md border p-2 font-mono text-sm"
                      placeholder="Paste your sequence here (FASTA format supported)"
                    ></textarea>
                  </div>
                  <Button className="bg-secondary-def hover:bg-secondary-def w-full">
                    Search by Sequence
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSearch;
