import {
  type FeelingLevel,
  type FeelingLevelId,
  type FeelingsState,
  createFeelingsViewModel,
  createInitialFeelingsState,
  selectFeelingLevel,
} from "./core/feelings";
import { loadFeelingsState, saveFeelingsState } from "./core/feelingsPersistence";
import { store } from "./storage";

const app = document.querySelector<HTMLDivElement>("#app");

let state: FeelingsState = createInitialFeelingsState();

function renderLevelButton(level: FeelingLevel, selectedLevel: FeelingLevel): HTMLButtonElement {
  const isSelected = level.id === selectedLevel.id;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "level-button";
  button.dataset.selected = String(isSelected);
  button.setAttribute("aria-pressed", String(isSelected));
  button.setAttribute("aria-label", `${level.label}を選ぶ`);
  button.style.setProperty("--level-color", level.color);

  const colorBand = document.createElement("span");
  colorBand.className = "level-color";
  colorBand.setAttribute("aria-hidden", "true");

  const face = document.createElement("span");
  face.className = "level-face";
  face.textContent = level.face;

  const number = document.createElement("span");
  number.className = "level-number";
  number.textContent = String(level.id);

  const label = document.createElement("span");
  label.className = "level-label";
  label.textContent = level.label;

  button.append(colorBand, face, number, label);
  button.addEventListener("click", () => {
    void handleLevelSelect(level.id);
  });

  return button;
}

function renderCards(level: FeelingLevel): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = "card-list";

  for (const cardText of level.cards) {
    const item = document.createElement("li");
    item.className = "care-card";
    item.textContent = cardText;
    list.append(item);
  }

  return list;
}

function render(): void {
  if (!app) return;

  const viewModel = createFeelingsViewModel(state);
  const { levels, selectedLevel } = viewModel;
  app.replaceChildren();

  const style = document.createElement("style");
  style.textContent = `
    .popup-shell { display: grid; gap: 12px; }
    .level-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .level-button {
      appearance: none;
      min-width: 0;
      border: 2px solid transparent;
      border-radius: 8px;
      background: color-mix(in srgb, var(--level-color) 22%, white);
      padding: 0 4px 8px;
      display: grid;
      grid-template-rows: 7px auto auto 1fr;
      gap: 3px;
      justify-items: center;
      cursor: pointer;
      font: inherit;
      min-height: 92px;
    }
    .level-button[data-selected="true"] {
      border-color: var(--level-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--level-color) 24%, white);
    }
    .level-button:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--level-color) 42%, white);
      outline-offset: 2px;
    }
    .level-color {
      width: calc(100% + 8px);
      height: 7px;
      border-radius: 6px 6px 0 0;
      background: var(--level-color);
    }
    .level-face { font-size: 24px; line-height: 1; }
    .level-number {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: white;
      color: #222;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    }
    .level-label { font-size: 11px; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
    .selected-heading { margin: 0; font-size: 16px; }
    .card-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .care-card {
      border-left: 6px solid ${selectedLevel.color};
      border-radius: 8px;
      background: #f7f7f7;
      padding: 10px 12px;
      font-size: 14px;
      line-height: 1.35;
    }
  `;

  const shell = document.createElement("main");
  shell.className = "popup-shell";

  const levelGrid = document.createElement("section");
  levelGrid.className = "level-grid";
  levelGrid.setAttribute("aria-label", "今の気持ち");
  levelGrid.append(...levels.map((level) => renderLevelButton(level, selectedLevel)));

  const selectedHeading = document.createElement("h4");
  selectedHeading.className = "selected-heading";
  selectedHeading.textContent = `${selectedLevel.face} ${selectedLevel.label} のとき`;

  const cardsSection = document.createElement("section");
  cardsSection.setAttribute("aria-label", "こうするといい");
  cardsSection.append(selectedHeading, renderCards(selectedLevel));

  shell.append(levelGrid, cardsSection);
  app.append(style, shell);
}

async function handleLevelSelect(levelId: FeelingLevelId): Promise<void> {
  state = selectFeelingLevel(state, levelId);
  render();
  await saveFeelingsState(store, state);
}

async function init(): Promise<void> {
  state = await loadFeelingsState(store);
  render();
}

void init();
