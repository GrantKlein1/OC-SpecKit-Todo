# C4 Level 4 — Deployment

Logical deployment: the **User PC** runs the SPA in a browser; the **Web Server** hosts static assets, the Node API, and MySQL.

```mermaid
C4Deployment
title Deployment Diagram — Todo

Deployment_Node(userPc, "User PC", "Developer / end-user computer") {
  Container(spa, "Web SPA", "Browser + Vue", "Loaded from Apache; runs on the user PC.")
}

Deployment_Node(webServer, "Web Server", "Classroom or CI deploy host") {
  Container(staticAssets, "Static Assets", "Apache", "Built Vue dist and .htaccess.")
  Container(api, "API", "Node.js + Express", "REST /todo on port 3200.")
  ContainerDb(db, "Database", "MySQL", "Users, sessions, lists, and todos.")
}

Rel(staticAssets, spa, "Serves", "HTTPS")
Rel(spa, api, "JSON", "Bearer JWT")
Rel(api, db, "SQL", "TCP")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
UpdateRelStyle(staticAssets, spa, $offsetY="-20")
UpdateRelStyle(spa, api, $offsetY="-15")
UpdateRelStyle(api, db, $offsetX="15")
```

## Typical ports

| Location | Service | Port |
|----------|---------|------|
| User PC | Browser | — |
| Web Server | Apache (SPA) | `80` / `443` |
| Web Server | Backend API | `3200` (or reverse-proxied) |
| Web Server | MySQL | `3306` |

## Notes

- Nested browser/Apache/runtime/database deployment nodes are intentionally flattened because Mermaid C4 packs deep nesting poorly in PDFs.
- **Local XAMPP classroom:** User PC and Web Server may be the **same** physical machine; the diagram preserves the logical browser/server boundary.
- **CI deploy** (`.github/workflows/deploy.yml`): builds SPA + backend, SSH-deploys static files and Node app to the Web Server; DB credentials via secrets.

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [c4-container.md](./c4-container.md) · `.github/workflows/deploy.yml`
