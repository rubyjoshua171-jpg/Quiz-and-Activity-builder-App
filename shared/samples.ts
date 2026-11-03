import type { Activity } from "./schemas";

export const SAMPLES: Record<Activity["type"], Activity> = {
  multiple_choice: {
    type: "multiple_choice",
    title: "Photosynthesis basics",
    instructions: "Pick the best answer.",
    questions: [
      { question: "What gas do plants absorb?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correctIndex: 1, explanation: "Plants take in CO2 for photosynthesis." },
      { question: "Where does photosynthesis happen?", options: ["Roots", "Chloroplasts", "Bark", "Seeds"], correctIndex: 1, explanation: "Chloroplasts contain chlorophyll." },
      { question: "What do plants make?", options: ["Glucose", "Plastic", "Salt", "Iron"], correctIndex: 0, explanation: "Glucose is the sugar plants make for energy." },
    ],
  },
  true_false: {
    type: "true_false",
    title: "Plant facts",
    instructions: "Decide if each statement is true or false.",
    statements: [
      { statement: "Plants make food at night.", answer: false, explanation: "Photosynthesis needs light." },
      { statement: "Chlorophyll is green.", answer: true, explanation: "It reflects green light." },
      { statement: "Plants release oxygen.", answer: true, explanation: "Oxygen is a by-product." },
    ],
  },
  flashcards: {
    type: "flashcards",
    title: "Plant vocabulary",
    instructions: "Flip each card to check yourself.",
    cards: [
      { front: "Chlorophyll", back: "Green pigment that absorbs light" },
      { front: "Stomata", back: "Tiny pores in leaves for gas exchange" },
      { front: "Glucose", back: "Sugar made during photosynthesis" },
    ],
  },
  matching: {
    type: "matching",
    title: "Parts of a plant cell",
    instructions: "Match each part to what it does.",
    pairs: [
      { left: "Chloroplast", right: "Makes food using sunlight" },
      { left: "Cell wall", right: "Keeps the cell rigid" },
      { left: "Vacuole", right: "Stores water" },
    ],
  },
  ordering: {
    type: "ordering",
    title: "Steps of photosynthesis",
    instructions: "Put the steps in the right order.",
    items: ["Light hits the leaf", "Water is split", "Glucose is made"],
  },
};
