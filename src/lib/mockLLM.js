export function mockLLMReply(userMessage) {
  const m = (userMessage || "").toLowerCase();

  const injectionHints = ["раскрой", "скрыт", "system prompt", "инструкц", "ignore previous", "покажи контекст"];
  if (injectionHints.some((x) => m.includes(x))) {
    return "Я не могу раскрывать скрытые инструкции/контекст. Задайте конкретные вопросы по фактам кейса (симптомы, метрики, ограничения, временная линия).";
  }

  if (m.includes("метрик") || m.includes("логи") || m.includes("что смотреть")) {
    return "Минимум: error rate (4xx/5xx), p95 latency, RPS, изменения после релиза, разрез по клиентам/гео, трассировка по request-id.";
  }

  if (m.includes("вводн") || m.includes("что известно") || m.includes("кратко")) {
    return "Уточните: (1) симптомы, (2) последние изменения, (3) ограничения, (4) кого уведомить. По каждому пункту дам точный ответ.";
  }

  return `Принято: "${userMessage.slice(0, 140)}". Уточните, что важнее сейчас: причина, масштаб, ограничения или план действий?`;
}