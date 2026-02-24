export default function myPlugin() {
  return {
    name: "my-custom-plugin",

    buildStart() {
      console.log("🚀 My Plugin Started");
    },

    transform(code, id) {
      if (id.endsWith(".jsx")) {
        console.log("Processing:", id);
      }
      return null;
    }
  };
}