Authoritative technology guideline for this repo. Basic modern TypeScript/NestJS practices, skimmable, no boilerplate.
Stack: Node.js, TypeScript (strict mode), NestJS (controller / service / repository layers), TypeORM with in-memory SQLite database, class-validator + class-transformer for DTO validation, Jest (unit tests with mocked dependencies) + Supertest (e2e / integration tests), React + Vite (front-end).

Key rules to include:
- TypeScript strict mode enabled; no `any` without explicit justification.
- NestJS module structure: one module per feature (controller, service, repository, entity, DTOs in the same folder).
- DTOs use `readonly` properties and `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, etc.).
- Persistence entities use TypeORM `@Entity` / `@Column` / `@PrimaryGeneratedColumn` decorators; never use plain interfaces for database models.
- Business logic lives in services; controllers must stay thin (no business logic).
- Every feature ships with both: a Jest unit test (service + controller with mocked dependencies) and a Supertest integration test hitting the running NestJS app.
- Error handling via NestJS exception filters (`@Catch`); use built-in `HttpException` subclasses.
- Naming: PascalCase for classes and decorators, camelCase for variables and methods, kebab-case for file names.
- ESLint + Prettier enforced; no committed code with lint errors.