function convertToArabicNumbers(num) {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((digit) => arabicNumbers[parseInt(digit)])
    .join("");
}

// خريطة أرقام 7-Segment (a,b,c,d,e,f,g)
const digitMap = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};

function createDigitUI(id) {
  const container = document.getElementById(id);
  if (!container) return;
  const segments = ["a", "b", "c", "d", "e", "f", "g"];
  segments.forEach((s) => {
    const div = document.createElement("div");
    div.className = `segment seg-${s}`;
    container.appendChild(div);
  });
}

function initAnalogClock() {
  const markings = document.getElementById("clockMarkings");
  if (!markings) return;
  markings.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const mark = document.createElement("div");
    mark.className = i % 3 === 0 ? "marking marking-hour" : "marking";
    mark.style.transform = `translateX(-50%) rotate(${i * 30}deg)`;
    markings.appendChild(mark);
  }
}

function updateDigit(id, value) {
  const container = document.getElementById(id);
  if (!container) return;
  const segments = container.children;
  const pattern = digitMap[value];
  for (let i = 0; i < 7; i++) {
    pattern[i]
      ? segments[i].classList.add("on")
      : segments[i].classList.remove("on");
  }
}

function updateClocks() {
  const now = new Date();

  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // تحويل إلى 12 ساعة (0 تصبح 12)

  // الرقمية
  const h = String(hours).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  updateDigit("h1", h[0]);
  updateDigit("h2", h[1]);
  updateDigit("m1", m[0]);
  updateDigit("m2", m[1]);
  updateDigit("s1", s[0]);
  updateDigit("s2", s[1]);

  // تحديث مؤشر AM/PM
  const ampmEl = document.getElementById("ampm");
  if (ampmEl) {
    ampmEl.innerText = ampm;
  }

  // العقارب (إصلاح المحور)
  const sc = now.getSeconds() * 6;
  const mn = now.getMinutes() * 6;
  const hr = (now.getHours() % 12) * 30 + mn / 12;

  const secHand = document.getElementById("sec-h");
  const minHand = document.getElementById("min-h");
  const hourHand = document.getElementById("hour-h");

  if (secHand) secHand.style.transform = `translateX(-50%) rotate(${sc}deg)`;
  if (minHand) minHand.style.transform = `translateX(-50%) rotate(${mn}deg)`;
  if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hr}deg)`;

  // التواريخ
  const dayEl = document.getElementById("date-day");
  const miladiEl = document.getElementById("date-miladi");
  const hijriEl = document.getElementById("date-hijri");

  if (dayEl || miladiEl || hijriEl) {
    const dayName = now.toLocaleDateString("ar-EG", { weekday: "long" });
    if (dayEl) dayEl.innerText = dayName;

    if (miladiEl) {
      const gFormatter = new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const parts = gFormatter.formatToParts(now);
      const d = parts.find((p) => p.type === "day").value;
      const mName = parts.find((p) => p.type === "month").value;
      const mNum = convertToArabicNumbers(now.getMonth() + 1);
      const y = parts.find((p) => p.type === "year").value;
      miladiEl.innerText = `${d} ${mName} -${mNum}- ${y} م`;
    }

    if (hijriEl) {
      const hFormatter = new Intl.DateTimeFormat(
        "ar-SA-u-ca-islamic-umalqura",
        { day: "numeric", month: "long", year: "numeric" },
      );
      const parts = hFormatter.formatToParts(now);
      const d = parts.find((p) => p.type === "day").value;
      const mName = parts.find((p) => p.type === "month").value;
      const mNumPart = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        month: "numeric",
      }).format(now);
      const y = parts.find((p) => p.type === "year").value;
      hijriEl.innerText = `${d} ${mName} -${mNumPart}- ${y} هـ`;
    }
  }
}
