module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "var(--shell-bg)",
        "shell-text": "var(--shell-text)",
        content: "var(--content-bg)",
      },
    },
  },
  plugins: [],
};
