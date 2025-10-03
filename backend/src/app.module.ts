import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HistoryModule } from './modules/history/history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: Number(configService.get('POSTGRES_PORT', 5432)),
        username: configService.get('POSTGRES_USER', 'comp_docs'),
        password: configService.get('POSTGRES_PASSWORD', 'comp_docs'),
        database: configService.get('POSTGRES_DB', 'comp_docs'),
        autoLoadEntities: true,
        synchronize: true
      }),
      inject: [ConfigService]
    }),
    AuthModule,
    DocumentsModule,
    ComparisonModule,
    ReportsModule,
    HistoryModule
  ]
})
export class AppModule {}
