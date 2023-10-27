import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import * as Joi from "joi";
import { Sequelize } from "sequelize-typescript";
import {
  CONFIG_DB_SCHEMA,
  ConfigModule,
} from "../../config-module/config.module";
import { DatabaseModule } from "../database.module";

describe("DatabaseModule Unit Tests", () => {
  describe("sqlite connection", () => {
    const connOptions = {
      DB_VENDOR: "sqlite",
      DB_HOST: ":memory:",
      DB_LOGGING: false,
      DB_AUTO_LOAD_MODELS: false,
    };

    it("should be valid", () => {
      const schema = Joi.object({
        ...CONFIG_DB_SCHEMA,
      });
      const { error } = schema.validate(connOptions);
      expect(error).toBeUndefined();
    });

    it("should be a sqlite connection", async () => {
      const module = await Test.createTestingModule({
        imports: [
          DatabaseModule,
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            validationSchema: null,
            load: [() => connOptions],
          }),
        ],
      }).compile();

      const app = module.createNestApplication();
      const conn = app.get<Sequelize>(getConnectionToken());
      expect(conn).toBeDefined();
      expect(conn.options.dialect).toBe(connOptions.DB_VENDOR);
      expect(conn.options.host).toBe(connOptions.DB_HOST);
      expect(conn.options.logging).toBeFalsy();
      //@ts-expect-error type is not correct: autoLoadModels exists in options
      expect(conn.options.autoLoadModels).toBeFalsy();
      await conn.close();
    });
  });

  describe("mysql connection", () => {
    const connOptions = {
      DB_VENDOR: "mysql",
      DB_HOST: "db",
      DB_DATABASE: "micro_videos",
      DB_USERNAME: "root",
      DB_PASSWORD: "root",
      DB_PORT: 3306,
      DB_LOGGING: false,
      DB_AUTO_LOAD_MODELS: true,
    };

    it("should be valid", () => {
      const schema = Joi.object({
        ...CONFIG_DB_SCHEMA,
      });
      const { error } = schema.validate(connOptions);
      expect(error).toBeUndefined();
    });

    it("should be a mysql connection", async () => {
      const module = await Test.createTestingModule({
        imports: [
          DatabaseModule,
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            validationSchema: null,
            load: [() => connOptions],
          }),
        ],
      }).compile();

      const app = module.createNestApplication();
      const conn = app.get<Sequelize>(getConnectionToken());
      expect(conn).toBeDefined();
      expect(conn.options.dialect).toBe(connOptions.DB_VENDOR);
      expect(conn.options.host).toBe(connOptions.DB_HOST);
      expect(conn.options.database).toBe(connOptions.DB_DATABASE);
      expect(conn.options.username).toBe(connOptions.DB_USERNAME);
      expect(conn.options.password).toBe(connOptions.DB_PASSWORD);
      expect(conn.options.port).toBe(connOptions.DB_PORT);
      expect(conn.options.logging).toBeFalsy();
      //@ts-expect-error type is not correct: autoLoadModels exists in options
      expect(conn.options.autoLoadModels).toBeTruthy();
      await conn.close();
    });
  });
});