import {
  type FeelingLevel,
  type FeelingLevelId,
  type FeelingsState,
  addCareCard,
  createFeelingsViewModel,
  createInitialFeelingsState,
  removeCareCard,
  selectFeelingLevel,
  updateCareCard,
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

function renderCards(levelId: FeelingLevelId, cardTexts: string[]): HTMLElement {
  const editor = document.createElement("div");
  editor.className = "card-editor";

  for (const [index, cardText] of cardTexts.entries()) {
    const row = document.createElement("div");
    row.className = "care-card";

    const input = document.createElement("input");
    input.className = "card-input";
    input.type = "text";
    input.value = cardText;
    input.setAttribute("aria-label", `対処カード${index + 1}`);
    input.addEventListener("change", () => {
      void handleCareCardUpdate(levelId, index, input.value);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "card-delete";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("aria-label", `${cardText}を削除`);
    deleteButton.addEventListener("click", () => {
      void handleCareCardRemove(levelId, index);
    });

    row.append(input, deleteButton);
    editor.append(row);
  }

  const addForm = document.createElement("form");
  addForm.className = "card-add-form";

  const addInput = document.createElement("input");
  addInput.className = "card-input";
  addInput.type = "text";
  addInput.placeholder = "新しい対処カード";
  addInput.setAttribute("aria-label", "新しい対処カード");

  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.className = "card-add";
  addButton.textContent = "追加";

  addForm.append(addInput, addButton);
  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleCareCardAdd(levelId, addInput.value);
  });

  editor.append(addForm);
  return editor;
}

function render(): void {
  if (!app) return;

  const viewModel = createFeelingsViewModel(state);
  const { levels, selectedLevel, careCards } = viewModel;
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
    .card-editor { display: grid; gap: 8px; }
    .care-card {
      border-left: 6px solid ${selectedLevel.color};
      border-radius: 8px;
      background: #f7f7f7;
      padding: 8px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .card-input {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d8d8d8;
      border-radius: 6px;
      padding: 8px 9px;
      font-size: 14px;
      line-height: 1.35;
      font-family: inherit;
    }
    .card-delete,
    .card-add {
      border: 1px solid #cfcfcf;
      border-radius: 6px;
      background: white;
      padding: 8px 10px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .card-add-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
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
  cardsSection.append(selectedHeading, renderCards(selectedLevel.id, careCards));

  shell.append(levelGrid, cardsSection);
  app.append(style, shell);
}

async function handleLevelSelect(levelId: FeelingLevelId): Promise<void> {
  state = selectFeelingLevel(state, levelId);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardAdd(levelId: FeelingLevelId, cardText: string): Promise<void> {
  state = addCareCard(state, levelId, cardText);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardUpdate(
  levelId: FeelingLevelId,
  cardIndex: number,
  cardText: string,
): Promise<void> {
  state = updateCareCard(state, levelId, cardIndex, cardText);
  render();
  await saveFeelingsState(store, state);
}

async function handleCareCardRemove(levelId: FeelingLevelId, cardIndex: number): Promise<void> {
  state = removeCareCard(state, levelId, cardIndex);
  render();
  await saveFeelingsState(store, state);
}

async function init(): Promise<void> {
  state = await loadFeelingsState(store);
  render();
}

void init();
