'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    updatedAt: string;
    isPublic: boolean;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formattedDate = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="p-0">
        <Link href={`/projects/${project.id}`}>
          <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-t-lg overflow-hidden">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg
                  className="w-16 h-16 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {project.isPublic ? (
                <span className="px-2 py-1 text-xs bg-green-500/90 text-white rounded-full backdrop-blur-sm">
                  Public
                </span>
              ) : (
                <span className="px-2 py-1 text-xs bg-gray-500/90 text-white rounded-full backdrop-blur-sm">
                  Private
                </span>
              )}
            </div>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link href={`/projects/${project.id}`}>
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {project.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || 'No description provided'}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
