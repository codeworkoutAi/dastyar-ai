const text = `__CODE_BLOCK_0__

---

# 📰 گزارش اخبار`;

const updated = text.replace(/__CODE_BLOCK_(\d+)__\s*\n*---\n*/g, '__CODE_BLOCK_$1__\n\n');
console.log("UPDATED:");
console.log(updated);
