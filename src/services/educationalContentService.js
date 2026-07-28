import { lessons } from "../data/exhibition/lessons.js";

export const getLessons = async () => lessons;
export const getLessonById = (id) => lessons.find((lesson) => lesson.id === id) || null;
