const display = document.getElementById("display");
const history = document.getElementById("history");
const historyList = document.getElementById("historyList");
const keys = document.querySelector(".keys");
const toolbar = document.querySelector(".toolbar");
const historyPanel = document.querySelector(".history-panel");

const calculator = {
  current: "0",
  previous: null,
  operator: null,
  waitingForNextNumber: false,
  memory: 0,
  records: [],
};

const operatorLabels = {
  "+": "+",
  "-": "-",
  "*": "x",
  "/": "/",
};

function updateDisplay() {
  display.textContent = calculator.current;

  if (calculator.operator && calculator.previous !== null) {
    history.textContent = `${calculator.previous} ${operatorLabels[calculator.operator]}`;
  } else {
    history.innerHTML = "&nbsp;";
  }
}

function renderHistory() {
  historyList.innerHTML = "";

  if (calculator.records.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-list__empty";
    emptyItem.textContent = "No calculations yet";
    historyList.appendChild(emptyItem);
    return;
  }

  calculator.records.slice(-5).reverse().forEach((record) => {
    const item = document.createElement("li");
    const expression = document.createElement("span");
    const result = document.createElement("span");

    expression.textContent = record.expression;
    result.textContent = record.result;
    result.className = "history-list__result";

    item.appendChild(expression);
    item.appendChild(result);
    historyList.appendChild(item);
  });
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const rounded = Number.parseFloat(value.toFixed(10));
  return rounded.toString();
}

function calculate(firstNumber, secondNumber, operator) {
  if (operator === "+") {
    return firstNumber + secondNumber;
  }

  if (operator === "-") {
    return firstNumber - secondNumber;
  }

  if (operator === "*") {
    return firstNumber * secondNumber;
  }

  if (operator === "/") {
    return secondNumber === 0 ? Number.NaN : firstNumber / secondNumber;
  }

  return secondNumber;
}

function inputNumber(number) {
  if (calculator.current === "Error") {
    clearCalculator();
  }

  if (calculator.waitingForNextNumber) {
    calculator.current = number === "." ? "0." : number;
    calculator.waitingForNextNumber = false;
    updateDisplay();
    return;
  }

  if (number === "." && calculator.current.includes(".")) {
    return;
  }

  calculator.current = calculator.current === "0" && number !== "."
    ? number
    : calculator.current + number;
  updateDisplay();
}

function chooseOperator(nextOperator) {
  if (calculator.current === "Error") {
    return;
  }

  const inputValue = Number(calculator.current);

  if (calculator.operator && calculator.waitingForNextNumber) {
    calculator.operator = nextOperator;
    updateDisplay();
    return;
  }

  if (calculator.previous === null) {
    calculator.previous = inputValue;
  } else if (calculator.operator) {
    const result = calculate(calculator.previous, inputValue, calculator.operator);
    calculator.current = formatResult(result);
    calculator.previous = Number(calculator.current);
  }

  calculator.operator = nextOperator;
  calculator.waitingForNextNumber = true;
  updateDisplay();
}

function showResult() {
  if (!calculator.operator || calculator.previous === null || calculator.current === "Error") {
    return;
  }

  const secondNumber = Number(calculator.current);
  const result = calculate(calculator.previous, secondNumber, calculator.operator);
  const expression = `${calculator.previous} ${operatorLabels[calculator.operator]} ${calculator.current}`;

  history.textContent = expression;
  calculator.current = formatResult(result);
  calculator.records.push({
    expression,
    result: calculator.current,
  });
  calculator.previous = null;
  calculator.operator = null;
  calculator.waitingForNextNumber = true;
  display.textContent = calculator.current;
  renderHistory();
}

function clearCalculator() {
  calculator.current = "0";
  calculator.previous = null;
  calculator.operator = null;
  calculator.waitingForNextNumber = false;
  updateDisplay();
}

function deleteLastDigit() {
  if (calculator.waitingForNextNumber || calculator.current === "Error") {
    calculator.current = "0";
    calculator.waitingForNextNumber = false;
  } else {
    calculator.current = calculator.current.length > 1
      ? calculator.current.slice(0, -1)
      : "0";
  }

  updateDisplay();
}

function toggleSign() {
  if (calculator.current === "0" || calculator.current === "Error") {
    return;
  }

  calculator.current = calculator.current.startsWith("-")
    ? calculator.current.slice(1)
    : `-${calculator.current}`;
  updateDisplay();
}

function convertToPercent() {
  if (calculator.current === "Error") {
    return;
  }

  calculator.current = formatResult(Number(calculator.current) / 100);
  updateDisplay();
}

function clearHistory() {
  calculator.records = [];
  renderHistory();
}

function useMemory(action) {
  if (calculator.current === "Error") {
    return;
  }

  const currentValue = Number(calculator.current);

  if (action === "memory-clear") {
    calculator.memory = 0;
  } else if (action === "memory-recall") {
    calculator.current = formatResult(calculator.memory);
    calculator.waitingForNextNumber = false;
    updateDisplay();
  } else if (action === "memory-add") {
    calculator.memory += currentValue;
  } else if (action === "memory-subtract") {
    calculator.memory -= currentValue;
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
}

async function copyResult() {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(calculator.current);
}

function handleAction(action) {
  if (action === "clear") {
    clearCalculator();
  } else if (action === "delete") {
    deleteLastDigit();
  } else if (action === "equals") {
    showResult();
  } else if (action === "sign") {
    toggleSign();
  } else if (action === "percent") {
    convertToPercent();
  } else if (action === "history-clear") {
    clearHistory();
  } else if (action === "theme") {
    toggleTheme();
  } else if (action === "copy") {
    copyResult();
  } else if (action.startsWith("memory-")) {
    useMemory(action);
  }
}

function handleButtonPress(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.number) {
    inputNumber(button.dataset.number);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action) {
    handleAction(button.dataset.action);
  }
}

keys.addEventListener("click", (event) => {
  handleButtonPress(event);
});

toolbar.addEventListener("click", handleButtonPress);
historyPanel.addEventListener("click", handleButtonPress);

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if ((key >= "0" && key <= "9") || key === ".") {
    inputNumber(key);
  } else if (["+", "-", "*", "/"].includes(key)) {
    chooseOperator(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    deleteLastDigit();
  } else if (key === "Escape") {
    clearCalculator();
  } else if (key === "%") {
    convertToPercent();
  } else if (key.toLowerCase() === "m") {
    useMemory("memory-recall");
  } else if (key.toLowerCase() === "c" && event.ctrlKey) {
    copyResult();
  }
});

updateDisplay();
renderHistory();
