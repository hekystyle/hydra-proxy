import {
  BadRequestException,
  Controller,
  Inject,
  Logger,
  Req,
  RequestMapping,
  RequestMethod,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import fetch, { type RequestInit } from 'node-fetch';
import type { AppConfigService } from './app.module.js';

@Controller({ path: '*' })
export class HydraController {
  private readonly logger = new Logger(HydraController.name);

  constructor(
    @Inject(ConfigService)
    private configService: AppConfigService,
  ) {}

  @RequestMapping({ path: '*', method: RequestMethod.ALL })
  async index(@Req() req: Request, @Res() clientResponse: Response): Promise<void> {
    const { method, url, headers } = req;

    const [type, base64] = headers.authorization?.split(' ') ?? [];

    if (!type || !base64) {
      throw new BadRequestException(`Missing authorization header`);
    }

    if (type !== 'Basic') {
      throw new BadRequestException(`Unsupported authorization type: ${type}`);
    }

    const [user, password] = Buffer.from(base64, 'base64').toString().split(':');

    if (!user || !password) {
      throw new BadRequestException(`Missing user or password`);
    }

    const userField = this.configService.get('USER_FIELD', { infer: true }) ?? 'username';

    const body = JSON.stringify({ [userField]: user, password });

    const targetUrl = new URL(url, `https://${this.configService.getOrThrow('TARGET_HOST', { infer: true })}`);

    const reqInit: RequestInit = {
      method,
      body,
      headers: { 'content-type': 'application/json' },
    };

    try {
      const targetResponse = await fetch(targetUrl, reqInit);

      if (targetResponse.status >= 500) {
        this.logger.warn(`Target server responded with ${targetResponse.status}`);
      }

      targetResponse.headers.forEach((value, key) => {
        clientResponse.setHeader(key, value);
      });

      clientResponse.status(targetResponse.status).send(targetResponse.body);
    } catch (err) {
      this.logger.error(err);
      this.logger.log(reqInit);
      throw err;
    }
  }
}
