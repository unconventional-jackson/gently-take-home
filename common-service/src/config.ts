import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { NodeLogger } from "@unconventional-code/observability-sdk";

if (!process.env.ENV) {
  throw new Error("ENV is not set");
}
const stage = process.env.ENV;

export interface IConfig {
  // Logging parameters only
  ENV: string;
  CLIENT: string;
  SERVICE: string;

  // General application configuration
  AWS_REGION: string;
  ACCESS_TOKEN_SECRET: string;
  APPLICATION_PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PROXY_HOST?: string;
  POSTGRES_PROXY_READONLY_HOST?: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_PORT: number;
  SENDGRID_API_KEY: string;
  SENDGRID_SOURCE_EMAIL_ADDRESS: string;
}

let config: IConfig | null;

export async function getConfig(): Promise<IConfig> {
  const log = new NodeLogger({ name: "utils/secrets" });
  try {
    if (config) {
      log.info("Already have the configuration");
      return config;
    }

    const secretsManagerClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const response = await secretsManagerClient.send(
      new GetSecretValueCommand({
        SecretId: `/${stage}/gently/config`,
      })
    );
    const secrets = JSON.parse(response.SecretString || "{}") as unknown;
    if (typeof secrets !== "object" || secrets === null) {
      throw new Error("Invalid secrets");
    }

    if (!("AWS_REGION" in secrets) || typeof secrets.AWS_REGION !== "string") {
      throw new Error("Missing environment variable AWS_REGION");
    }
    process.env.AWS_REGION = secrets.AWS_REGION;
    if (
      !("POSTGRES_HOST" in secrets) ||
      typeof secrets.POSTGRES_HOST !== "string"
    ) {
      throw new Error("Missing environment variable POSTGRES_HOST");
    }

    let postgresProxyHost: string | undefined;
    if ("POSTGRES_PROXY_HOST" in secrets) {
      if (typeof secrets.POSTGRES_PROXY_HOST !== "string") {
        throw new Error("Invalid environment variable POSTGRES_PROXY_HOST");
      }
      postgresProxyHost = secrets.POSTGRES_PROXY_HOST;
    }
    if ("POSTGRES_PROXY_READONLY_HOST" in secrets) {
      if (typeof secrets.POSTGRES_PROXY_READONLY_HOST !== "string") {
        throw new Error(
          "Invalid environment variable POSTGRES_PROXY_READONLY_HOST"
        );
      }
      postgresProxyHost = secrets.POSTGRES_PROXY_READONLY_HOST;
    }

    if (
      !("POSTGRES_USER" in secrets) ||
      typeof secrets.POSTGRES_USER !== "string"
    ) {
      throw new Error("Missing environment variable POSTGRES_USER");
    }

    if (
      !("POSTGRES_PASSWORD" in secrets) ||
      typeof secrets.POSTGRES_PASSWORD !== "string"
    ) {
      throw new Error("Missing environment variable POSTGRES_PASSWORD");
    }

    if (
      !("POSTGRES_DB" in secrets) ||
      typeof secrets.POSTGRES_DB !== "string"
    ) {
      throw new Error("Missing environment variable POSTGRES_DB");
    }

    if (
      !("POSTGRES_PORT" in secrets) ||
      isNaN(parseInt(String(secrets.POSTGRES_PORT)))
    ) {
      throw new Error("Missing environment variable POSTGRES_PORT");
    }

    if (
      !("APPLICATION_PORT" in secrets) ||
      isNaN(parseInt(String(secrets.APPLICATION_PORT)))
    ) {
      throw new Error("Missing environment variable APPLICATION_PORT");
    }

    if (
      !("ACCESS_TOKEN_SECRET" in secrets) ||
      typeof secrets.ACCESS_TOKEN_SECRET !== "string"
    ) {
      throw new Error("Missing environment variable ACCESS_TOKEN_SECRET");
    }

    if (!("ENV" in secrets) || typeof secrets.ENV !== "string") {
      throw new Error("Missing environment variable ENV");
    }

    if (
      !("SENDGRID_API_KEY" in secrets) ||
      typeof secrets.SENDGRID_API_KEY !== "string"
    ) {
      throw new Error("Missing environment variable SENDGRID_API_KEY");
    }
    if (
      !("SENDGRID_SOURCE_EMAIL_ADDRESS" in secrets) ||
      typeof secrets.SENDGRID_SOURCE_EMAIL_ADDRESS !== "string"
    ) {
      throw new Error(
        "Missing environment variable SENDGRID_SOURCE_EMAIL_ADDRESS"
      );
    }

    if (!("CLIENT" in secrets) || typeof secrets.CLIENT !== "string") {
      throw new Error("Missing environment variable CLIENT");
    }

    if (!("SERVICE" in secrets) || typeof secrets.SERVICE !== "string") {
      throw new Error("Missing environment variable SERVICE");
    }

    if (
      "LOGGING_NEW_RELIC_ENABLED" in secrets &&
      secrets.LOGGING_NEW_RELIC_ENABLED === "true"
    ) {
      process.env.LOGGING_NEW_RELIC_ENABLED = "true";
      if (
        !("NEW_RELIC_API_KEY" in secrets) ||
        typeof secrets.NEW_RELIC_API_KEY !== "string"
      ) {
        throw new Error("Missing environment variable NEW_RELIC_API_KEY");
      }
      // eslint-disable-next-line no-console
      console.log("Setting NEW_RELIC_API_KEY to enable NR Logging");
      process.env.NEW_RELIC_API_KEY = secrets.NEW_RELIC_API_KEY;
    }

    config = {
      AWS_REGION: secrets.AWS_REGION,
      POSTGRES_HOST: secrets.POSTGRES_HOST,
      POSTGRES_PROXY_HOST: postgresProxyHost,
      POSTGRES_PROXY_READONLY_HOST: postgresProxyHost,
      POSTGRES_USER: secrets.POSTGRES_USER,
      POSTGRES_PASSWORD: secrets.POSTGRES_PASSWORD,
      POSTGRES_DB: secrets.POSTGRES_DB,
      POSTGRES_PORT: parseInt(String(secrets.POSTGRES_PORT)),
      ACCESS_TOKEN_SECRET: secrets.ACCESS_TOKEN_SECRET,
      ENV: secrets.ENV,
      APPLICATION_PORT: parseInt(String(secrets.APPLICATION_PORT)),
      SENDGRID_API_KEY: secrets.SENDGRID_API_KEY,
      SENDGRID_SOURCE_EMAIL_ADDRESS: secrets.SENDGRID_SOURCE_EMAIL_ADDRESS,
      CLIENT: secrets.CLIENT,
      SERVICE: secrets.SERVICE,
    };

    return config;
  } catch (error) {
    log.error(error, { detail: "Error getting the configuration" });
    throw error;
  }
}
