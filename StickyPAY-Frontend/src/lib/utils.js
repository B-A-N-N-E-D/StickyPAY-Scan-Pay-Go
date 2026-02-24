import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function createPageUrl(path) {
    return `/${path}`;
}

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}


