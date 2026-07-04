const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const readmePath = path.join(repoRoot, "README.md");
const appPath = path.join(repoRoot, "server", "app.js");
const routesDir = path.join(repoRoot, "server", "routes");
const controllersDir = path.join(repoRoot, "server", "controllers");
const componentsDir = path.join(repoRoot, "client", "src", "components");

const GENERATED_SECTIONS = {
  PROJECT_STRUCTURE: generateProjectStructureSection,
  FRONTEND_COMPONENTS: generateFrontendComponentsSection,
  API_REFERENCE: generateApiReferenceSection,
};

const DIRECTORIES_TO_SKIP = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
]);

const FILES_TO_SKIP = new Set([
  "package-lock.json",
]);

const DESCRIPTION_OVERRIDES = {
  registerUser: "Register a new user",
  loginUser: "Log in a user",
  logoutUser: "Log out the current user",
  isUserAdmin: "Check whether the current user is an admin",
  forgotPassword: "Send password reset email",
  resetPassword: "Reset password with token",
};

function main() {
  const checkMode = process.argv.includes("--check");
  const readme = fs.readFileSync(readmePath, "utf8");
  const nextReadme = Object.entries(GENERATED_SECTIONS).reduce(
    (content, [sectionName, generator]) => replaceSection(content, sectionName, generator()),
    readme,
  );

  if (nextReadme === readme) {
    console.log(checkMode ? "README is up to date." : "README already up to date.");
    return;
  }

  if (checkMode) {
    console.error("README is out of date. Run `npm run readme:sync`.");
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(readmePath, nextReadme);
  console.log("README updated.");
}

function replaceSection(readme, sectionName, content) {
  const pattern = new RegExp(
    `<!-- BEGIN_${sectionName} -->[\\s\\S]*?<!-- END_${sectionName} -->`,
    "g",
  );
  const replacement = `<!-- BEGIN_${sectionName} -->\n${content}\n<!-- END_${sectionName} -->`;

  if (!pattern.test(readme)) {
    throw new Error(`Missing markers for ${sectionName} in README.md`);
  }

  return readme.replace(pattern, replacement);
}

function generateProjectStructureSection() {
  const lines = ["```text", ".", ...renderTree(repoRoot, "."), "```"];
  return lines.join("\n");
}

function renderTree(currentPath, relativePath, prefix = "", depth = 0) {
  const entries = fs
    .readdirSync(currentPath, { withFileTypes: true })
    .filter((entry) => shouldIncludeEntry(relativePath, entry))
    .sort(compareEntries);

  const lines = [];

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const branch = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    const entryPath = path.join(currentPath, entry.name);
    const entryRelativePath = relativePath === "." ? entry.name : path.posix.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      lines.push(`${prefix}${branch}${entry.name}/`);
      lines.push(...renderTree(entryPath, entryRelativePath, nextPrefix, depth + 1));
    } else {
      lines.push(`${prefix}${branch}${entry.name}`);
    }
  });

  return lines;
}

function shouldIncludeEntry(parentRelativePath, entry) {
  if (entry.isDirectory()) {
    return !DIRECTORIES_TO_SKIP.has(entry.name);
  }

  if (FILES_TO_SKIP.has(entry.name)) {
    return false;
  }

  if (parentRelativePath === "." && entry.name === "package-lock.json") {
    return false;
  }

  return true;
}

function compareEntries(a, b) {
  if (a.isDirectory() && !b.isDirectory()) return -1;
  if (!a.isDirectory() && b.isDirectory()) return 1;
  return a.name.localeCompare(b.name);
}

function generateFrontendComponentsSection() {
  const componentFiles = listFiles(componentsDir, (filePath) =>
    /\.(jsx|tsx|js|ts)$/.test(filePath),
  );

  const rows = componentFiles.map((filePath) => {
    const relative = toPosix(path.relative(repoRoot, filePath));
    const componentPath = relative.replace(/^client\/src\/components\//, "");
    const segments = componentPath.split("/");
    const category = segments.slice(0, -1).join(" / ");
    const componentName = path.basename(filePath, path.extname(filePath));
    return `| ${category || "Root"} | ${componentName} | \`${relative}\` |`;
  });

  return [
    "| Area | Component | File |",
    "|------|-----------|------|",
    ...rows,
  ].join("\n");
}

function generateApiReferenceSection() {
  const controllerDescriptions = loadControllerDescriptions();
  const routeGroups = loadRouteGroups(controllerDescriptions);
  const sections = ["All endpoints are prefixed with `/api`."];

  routeGroups.forEach((group) => {
    sections.push("");
    sections.push(`### ${group.name} — \`${group.prefix}\``);
    sections.push("");
    sections.push("| Method | Route | Auth | Description |");
    sections.push("|--------|-------|------|-------------|");

    group.routes.forEach((route) => {
      sections.push(
        `| ${route.method} | \`${route.path}\` | ${route.auth} | ${route.description} |`,
      );
    });
  });

  sections.push("");
  sections.push("### Rate Limits");
  sections.push("");
  sections.push("| Scope | Limit |");
  sections.push("|-------|-------|");
  sections.push("| All `/api/*` | 100 req / 15 min |");
  sections.push("| `/api/auth/*` | 20 req / 15 min |");

  return sections.join("\n");
}

function loadControllerDescriptions() {
  const files = listFiles(controllersDir, (filePath) => filePath.endsWith(".js"));
  const descriptions = {};

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const docCommentPattern =
      /\/\*\*[\s\S]*?@desc\s+(.+?)\s*[\r\n][\s\S]*?\*\/\s*const\s+(\w+)\s*=/g;

    for (const match of content.matchAll(docCommentPattern)) {
      descriptions[match[2]] = normalizeSentence(match[1]);
    }
  });

  return descriptions;
}

function loadRouteGroups(controllerDescriptions) {
  const appContent = fs.readFileSync(appPath, "utf8");
  const importMap = {};
  const groups = [];
  const routeImportPattern = /import\s+(\w+)\s+from\s+"(.\/routes\/[^"]+)";/g;

  for (const match of appContent.matchAll(routeImportPattern)) {
    importMap[match[1]] = path.resolve(path.dirname(appPath), match[2]);
  }

  const appUsePattern = /app\.use\("([^"]+)",\s*(\w+)\);/g;

  for (const match of appContent.matchAll(appUsePattern)) {
    const prefix = match[1];
    const importName = match[2];
    const routeFile = importMap[importName];

    if (!routeFile || !routeFile.startsWith(routesDir)) {
      continue;
    }

    groups.push({
      name: formatGroupName(prefix),
      prefix,
      routes: loadRoutesFromFile(routeFile, prefix, controllerDescriptions),
    });
  }

  return groups;
}

function loadRoutesFromFile(routeFile, prefix, controllerDescriptions) {
  const content = fs.readFileSync(routeFile, "utf8");
  const routes = [];
  const chainedBlocks = [...content.matchAll(/router\s*\.route\("([^"]+)"\)([\s\S]*?);/g)];

  chainedBlocks.forEach((match) => {
    const routePath = match[1];
    const block = match[2];

    block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const chainedRouteMatch = line.match(/^\.(get|post|put|patch|delete)\((.+)\)$/);

        if (!chainedRouteMatch) {
          return;
        }

        routes.push(
          buildRouteRow(
            prefix,
            chainedRouteMatch[1],
            routePath,
            chainedRouteMatch[2],
            controllerDescriptions,
          ),
        );
      });
  });

  const contentWithoutChainedBlocks = content.replace(
    /router\s*\.route\("([^"]+)"\)([\s\S]*?);/g,
    "",
  );
  const lines = contentWithoutChainedBlocks.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s*\/\/.*$/, "").trim();

    if (!line || line.startsWith("//") || line.startsWith("*")) {
      continue;
    }

    const directRouteMatch = line.match(
      /^router\.(get|post|put|patch|delete)\("([^"]+)",\s*(.+)\);$/,
    );

    if (directRouteMatch) {
      routes.push(
        buildRouteRow(
          prefix,
          directRouteMatch[1],
          directRouteMatch[2],
          directRouteMatch[3],
          controllerDescriptions,
        ),
      );
    }
  }

  return routes;
}

function buildRouteRow(prefix, method, routePath, handlers, controllerDescriptions) {
  const handlerName = findLastHandlerName(handlers);
  return {
    method: method.toUpperCase(),
    path: routePath,
    auth: /\b(protect|admin)\b/.test(handlers) ? "✅" : "—",
    description: controllerDescriptions[handlerName] || describeHandler(handlerName),
    fullPath: `${prefix}${routePath}`,
  };
}

function findLastHandlerName(handlers) {
  const matches = handlers.match(/\b([A-Za-z_]\w*)\b/g) || [];
  const filtered = matches.filter(
    (token) =>
      !["router", "protect", "admin", "upload", "single"].includes(token),
  );
  return filtered[filtered.length - 1] || "handler";
}

function describeHandler(handlerName) {
  if (DESCRIPTION_OVERRIDES[handlerName]) {
    return DESCRIPTION_OVERRIDES[handlerName];
  }

  return normalizeSentence(
    handlerName
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .toLowerCase(),
  );
}

function normalizeSentence(value) {
  const sentence = value.replace(/[—–-]\s*/g, " ").trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function formatGroupName(prefix) {
  const name = prefix.replace(/^\/api\//, "");
  return name
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function listFiles(startPath, predicate) {
  const results = [];
  const entries = fs.readdirSync(startPath, { withFileTypes: true }).sort(compareEntries);

  entries.forEach((entry) => {
    const entryPath = path.join(startPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...listFiles(entryPath, predicate));
      return;
    }

    if (predicate(entryPath)) {
      results.push(entryPath);
    }
  });

  return results;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

main();
