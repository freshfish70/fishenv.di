# @fishenv/di

A lightweight, type-safe dependency injection container for TypeScript projects. This library provides a simple yet powerful way to manage dependencies in your application with support for different scoping options.

It was created for my own use, and is not intended to be a production-ready library.

This does not depend on any other libraries, or deprecated `experimentalDecorators` or `emitDecoratorMetadata`.


```warning
This library is still in development and may have bugs or limitations.
```

## Features

- **Type-safe** - Full TypeScript support with proper type inference
- **Flexible** - Multiple ways to provide dependencies (value, class, factory)
- **Scoped** - Support for both singleton and transient scopes
- **Decorator Support** - Easy class decoration for dependency injection
- **Lightweight** - Zero dependencies and minimal overhead

## Installation

```bash
# Using JSR
jsr add @fishenv/di
```

## Usage

### Basic Usage

```typescript
import { DIContainer, injectable, Scope } from "@fishenv/di";

// Create a container
const container = new DIContainer();

// Register a class with singleton scope
@injectable()
class DatabaseService {
  connect() {
    return "Connected to database";
  }
}

container.register(DatabaseService, { useClass: DatabaseService, scope: Scope.Singleton });

// Register a value
const config = { apiKey: "12345" };
const Config = Symbol("Config");
container.register(Config, { useValue: config });

// Resolve dependencies
const dbService = container.resolve(DatabaseService);
console.log(dbService.connect()); // "Connected to database"

const configValue = container.resolve(Config);
console.log(configValue); // { apiKey: "12345" }
```

### Dependency Injection with Constructor Parameters

```typescript
@injectable()
class UserService {
  constructor(private db: DatabaseService) {}

  getUsers() {
    return this.db.query("SELECT * FROM users");
  }
}

// Register with dependencies automatically injected
container.register(UserService, { 
  useClass: UserService,
  scope: Scope.Transient 
});

// Resolve with dependencies automatically injected
const userService = container.resolve(UserService);
```

### Factory Provider

```typescript
const ApiClient = Symbol("ApiClient");
container.register(ApiClient, {
  useFactory: (container) => {
    const config = container.resolve(Config);
    return new ApiClient(config.apiKey);
  },
  scope: Scope.Singleton
});
```

## API Reference

### `DIContainer`

The main container class that manages dependencies.

#### Methods

- `register<T>(token: Token<T>, provider: Provider<T>): void` - Registers a provider for a token
- `resolve<T>(token: Token<T>): T` - Resolves a dependency by its token
- `clear(): void` - Clears all registered providers and instances

### Decorators

- `@injectable(...dependencies: Token[])` - Marks a class as injectable with its dependencies

### Scopes

- `Scope.Singleton` - A single instance is created and reused
- `Scope.Transient` - A new instance is created each time

### Provider Types

- `ValueProvider` - Provides a static value
- `ClassProvider` - Provides an instance of a class
- `FactoryProvider` - Provides a value created by a factory function

## License

MIT
