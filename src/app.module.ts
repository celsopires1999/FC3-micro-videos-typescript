import { Module } from "@nestjs/common";
import { CastMembersModule } from "./nest-modules/cast-members-module/cast-members.module";
import { CategoriesModule } from "./nest-modules/categories-module/categories.module";
import { ConfigModule } from "./nest-modules/config-module/config.module";
import { DatabaseModule } from "./nest-modules/database-module/database.module";
import { SharedModule } from "./nest-modules/shared-module/shared.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    CategoriesModule,
    CastMembersModule,
    SharedModule,
  ],
})
export class AppModule {}
