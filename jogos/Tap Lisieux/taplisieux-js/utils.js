// ===================================================
// FORMATAÇÃO DE NÚMEROS
// ===================================================
export function formatarNum(n){
    if(n === null || n === undefined) return "0";

    if(n >= 1e12) return (n/1e12).toFixed(1) + "T";
    if(n >= 1e9)  return (n/1e9).toFixed(1) + "B";
    if(n >= 1e6)  return (n/1e6).toFixed(1) + "M";
    if(n >= 1e3)  return (n/1e3).toFixed(1) + "K";

    return Math.floor(n).toString();
}


// ===================================================
// NÚMEROS ALEATÓRIOS
// ===================================================
export function rand(min, max){
    return Math.random() * (max - min) + min;
}

export function randInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// ===================================================
// CHANCE / PROBABILIDADE
// ===================================================
export function chance(prob){
    return Math.random() < prob;
}


// ===================================================
// LIMITADOR (CLAMP)
// ===================================================
export function clamp(valor, min, max){
    return Math.max(min, Math.min(max, valor));
}


// ===================================================
// DISTÂNCIA (muito usado em jogos)
// ===================================================
export function distancia(x1, y1, x2, y2){
    return Math.hypot(x2 - x1, y2 - y1);
}


// ===================================================
// INTERPOLAÇÃO (animação suave)
// ===================================================
export function lerp(a, b, t){
    return a + (b - a) * t;
}


// ===================================================
// FORMATAÇÃO DE TEMPO (opcional, útil depois)
// ===================================================
export function formatarTempo(segundos){
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
