/**
 * This is a dependency injection container for TypeScript projects, using native decorators.
 * @module @fishenv/di
 */
// deno-lint-ignore-file no-explicit-any
export type Token<T = any> =
  | {
      new (...args: any[]): T;
    }
  | string
  | symbol;

export interface Type<T> {
  new (...args: any[]): T;
}

export enum Scope {
  Singleton,
  Transient,
}

/**
 * A provider that uses a value.
 */
export interface ValueProvider<T> {
  useValue: T;
}

/**
 * A provider that uses a factory function.
 */
export interface FactoryProvider<T> {
  useFactory: (container: DIContainer) => T;
}

/**
 * A provider that uses a class.
 */
export interface ClassProvider<T> {
  useClass: Type<T>;
  scope?: Scope;
}

/**
 * Union type of all provider types.
 */
export type Provider<T> =
  | ValueProvider<T>
  | FactoryProvider<T>
  | ClassProvider<T>;

/**
 * Checks if a provider is a value provider.
 */
export function isValueProvider<T>(
  provider: Provider<T>
): provider is ValueProvider<T> {
  return (provider as ValueProvider<T>).useValue !== undefined;
}

/**
 * Checks if a provider is a factory provider.
 */
export function isFactoryProvider<T>(
  provider: Provider<T>
): provider is FactoryProvider<T> {
  return (provider as FactoryProvider<T>).useFactory !== undefined;
}

/**
 * Checks if a provider is a class provider.
 */
export function isClassProvider<T>(
  provider: Provider<T>
): provider is ClassProvider<T> {
  return (provider as ClassProvider<T>).useClass !== undefined;
}

/**
 * Container for all dependencies.
 */
const dependenciesMap = new WeakMap<any, Token<any>[]>();

/**
 * Gets the dependencies of a class.
 * @param target - The class to get the dependencies of.
 */
export function getDependencies(target: any): Token<any>[] {
  return dependenciesMap.get(target) || [];
}

/**
 * Decorator that marks a class as injectable.
 * @param dependencies - The dependencies of the class.
 */
export function injectable(
  ...dependencies: Token<any>[]
): (target: any, context: ClassDecoratorContext) => void {
  return function (target: any, context: ClassDecoratorContext) {
    if (context.kind !== "class") {
      throw new DiError("@injectable can only be used on classes");
    }
    dependenciesMap.set(target, dependencies);
  };
}

/**
 * The dependency injection container.
 * There can exist multiple containers in an application if needed.
 * All containers are isolated from each other.
 *
 * @example
 * ```typescript
 * const container = new DIContainer();
 * container.register("logger", { useValue: console });
 * container.register("service", { useClass: Service });
 * const service = container.resolve("service");
 * ```
 */
export class DIContainer {
  private providers = new Map<Token<any>, Provider<any>>();
  private singletons = new Map<Token<any>, any>();

  /**
   * Registers a provider for a token.
   *
   * @param token - The token to register the provider for.
   * @param provider - The provider to register.
   */
  public register<T>(token: Token<T>, provider: Provider<T>): void {
    this.providers.set(token, provider);
  }

  /**
   * Resolves a dependency from the container, a provider must be registered for the token.
   * It will create a new instance if the provider is a class provider and the scope is transient.
   * It will return the same instance if the provider is a class provider and the scope is singleton.
   *
   * throws DiError if no provider is registered for the token.
   *
   * @param token - The token of the dependency to resolve.
   * @returns The resolved dependency.
   */
  public resolve<T>(token: Token<T>): T {
    const provider = this.providers.get(token);

    if (provider) {
      if (isValueProvider(provider)) {
        return provider.useValue;
      }

      if (isFactoryProvider(provider)) {
        return provider.useFactory(this);
      }

      if (isClassProvider(provider)) {
        if (provider.scope === Scope.Singleton) {
          if (this.singletons.has(token)) {
            return this.singletons.get(token);
          }
          const instance = this.createInstance(provider.useClass);
          this.singletons.set(token, instance);
          return instance;
        }
        return this.createInstance(provider.useClass);
      }
    }

    if (typeof token === "function") {
      const instance = this.createInstance(token as Type<T>);
      this.singletons.set(token, instance);
      return instance;
    }

    throw new DiError(`No provider found for token: ${token.toString()}`);
  }

  /**
   * Creates an instance of a class, using the dependencies registered in the container.
   *
   * @param target - The class to create an instance of.
   * @returns The instance of the class.
   */
  private createInstance<T>(target: Type<T>): T {
    const dependencies = getDependencies(target);
    const resolvedDependencies = dependencies.map((dep) => this.resolve(dep));
    return new target(...resolvedDependencies);
  }

  /**
   * Clears all providers and singletons from the container.
   */
  public clear(): void {
    this.providers.clear();
    this.singletons.clear();
  }
}

/**
 * Explicit error for the DI container.
 */
class DiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiError";
  }
}
