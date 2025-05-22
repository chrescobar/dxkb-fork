"use client";

import React, { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { searchTypes } from '../../constants/searchInfo';

interface SearchBarProps {
  initialValue?: string;
  className?: string;
  placeholder?: string;
  size?: "default" | "lg";
  showIcon?: boolean;
}

export function SearchBar({
  initialValue = "",
  className = "",
  placeholder = "Search by virus name, protein, gene, or taxonomy...",
  size = "default",
  showIcon = true,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const router = useRouter();

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    router.push(`/buildsearch?q=${encodeURIComponent(inputValue)}&searchtype=${selected}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const [selected, setSelected] = useState("everything");
  const [selectedTitle, setSelectedTitle] = useState("All Data Types");

  const handleSelect = (val: string, title: string) => {
    setSelected(val);
    setSelectedTitle(title);
  };

  return (
    <form onSubmit={handleSearch} className={`flex gap-4 ${className}`}>
      <div className="relative flex-grow">
        <Input
          type="text"
          placeholder={placeholder}
          className={`${size === "lg" ? "py-6" : ""} ${showIcon ? "pl-10" : ""} bg-white`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {showIcon && (
          <LuSearch
            className="absolute top-1/2 left-3 -translate-y-1/2 transform text-primary-500"
            size={18}
          />
        )}
      </div>

      <select
        id="searchtype"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className={`${size === "lg" ? "py-2" : ""} ${showIcon ? "pl-4" : ""} bg-white`}
        >
        {searchTypes.map((option) => (
          <option key={option.id} value={option.id}>
            {option.typeTitle}
          </option>
        ))}
      </select>
      
      <Button
        type="submit"
        size={size}
        className={`bg-secondary-def hover:bg-secondary-def ${
          size === "lg" ? "py-6" : ""
        }`}
      >
        Search
      </Button>
    </form>
  );
}
