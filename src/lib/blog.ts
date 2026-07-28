import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface PostFrontmatter {
  title: string;
  excerpt: string;
  date: string; // ISO yyyy-mm-dd
  tags?: string[];
  coverImage?: string;
}

export interface Post {
  slug: string;
  content: string;
  frontmatter: PostFrontmatter;
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// Estonian is the primary/source-of-truth locale (mirrors get-dictionary.ts) —
// a post missing its English translation falls back to the Estonian file
// rather than 404ing.
export function getPostBySlug(slug: string, lang: Locale): Post | null {
  const dir = path.join(BLOG_DIR, slug);
  if (!fs.existsSync(dir)) return null;

  const localePath = path.join(dir, `${lang}.mdx`);
  const fallbackPath = path.join(dir, `${defaultLocale}.mdx`);
  const filePath = fs.existsSync(localePath) ? localePath : fallbackPath;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  return { slug, content, frontmatter: data as PostFrontmatter };
}

export function getAllPosts(lang: Locale): Post[] {
  return getAllPostSlugs()
    .map((slug) => getPostBySlug(slug, lang))
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
}
