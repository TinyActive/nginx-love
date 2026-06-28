import { Request, Response } from 'express';
import { botManagerService } from './bot-manager.service';
import {
  validateCreateBotProfile,
  validateUpdateBotProfile,
  validateCreateBotRule,
  validateUpdateBotRule,
  validateAssignProfile,
} from './dto/bot-manager.dto';

export class BotManagerController {
  async getProfiles(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const enabled = req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined;
      const policyMode = req.query.policyMode as 'blacklist' | 'whitelist' | undefined;

      const result = await botManagerService.getProfiles({ page, limit, search, enabled, policyMode });
      res.json({ success: true, data: result.profiles, pagination: result.pagination });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const profile = await botManagerService.getProfileById(req.params.id);
      res.json({ success: true, data: profile });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 404).json({ success: false, message: err.message });
    }
  }

  async createProfile(req: Request, res: Response) {
    try {
      const errors = validateCreateBotProfile(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      const profile = await botManagerService.createProfile(req.body);
      res.status(201).json({ success: true, data: profile });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const errors = validateUpdateBotProfile(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      const profile = await botManagerService.updateProfile(req.params.id, req.body);
      res.json({ success: true, data: profile });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async deleteProfile(req: Request, res: Response) {
    try {
      await botManagerService.deleteProfile(req.params.id);
      res.json({ success: true, message: 'Bot profile deleted' });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async toggleProfile(req: Request, res: Response) {
    try {
      const profile = await botManagerService.toggleProfile(req.params.id);
      res.json({ success: true, data: profile });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async getProfileRules(req: Request, res: Response) {
    try {
      const result = await botManagerService.getRules({
        profileId: req.params.id,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.json({ success: true, data: result.rules, pagination: result.pagination });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createProfileRule(req: Request, res: Response) {
    try {
      const errors = validateCreateBotRule(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      const rule = await botManagerService.createRule({
        ...req.body,
        profileId: req.params.id,
      });
      res.status(201).json({ success: true, data: rule });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async getGlobalRules(req: Request, res: Response) {
    try {
      const rules = await botManagerService.getGlobalRules();
      res.json({ success: true, data: rules });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createGlobalRule(req: Request, res: Response) {
    try {
      const errors = validateCreateBotRule(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      const rule = await botManagerService.createRule({ ...req.body, profileId: null });
      res.status(201).json({ success: true, data: rule });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async updateRule(req: Request, res: Response) {
    try {
      const errors = validateUpdateBotRule(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      const rule = await botManagerService.updateRule(req.params.ruleId, req.body);
      res.json({ success: true, data: rule });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async deleteRule(req: Request, res: Response) {
    try {
      await botManagerService.deleteRule(req.params.ruleId);
      res.json({ success: true, message: 'Bot rule deleted' });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async toggleRule(req: Request, res: Response) {
    try {
      const rule = await botManagerService.toggleRule(req.params.ruleId);
      res.json({ success: true, data: rule });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async assignDomain(req: Request, res: Response) {
    try {
      const errors = validateAssignProfile(req.body);
      if (errors.length) return res.status(400).json({ success: false, errors });

      await botManagerService.assignProfileToDomain(req.params.id, req.body);
      res.json({ success: true, message: 'Profile assigned to domain' });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async removeDomain(req: Request, res: Response) {
    try {
      await botManagerService.removeProfileFromDomain(req.params.id, req.params.domainId);
      res.json({ success: true, message: 'Profile removed from domain' });
    } catch (error: unknown) {
      const err = error as { message: string; statusCode?: number };
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  async getByDomain(req: Request, res: Response) {
    try {
      const profiles = await botManagerService.getProfilesByDomain(req.params.domainId);
      res.json({ success: true, data: profiles });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async preview(req: Request, res: Response) {
    try {
      const config = await botManagerService.previewConfig();
      res.json({ success: true, data: { config } });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async apply(req: Request, res: Response) {
    try {
      const result = await botManagerService.applyRules();
      res.json({ success: result.success, message: result.message });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getFingerprints(req: Request, res: Response) {
    try {
      const result = await botManagerService.getFingerprints({
        isBuiltin: req.query.isBuiltin === 'true' ? true : undefined,
        search: req.query.search as string,
        fingerprintType: req.query.fingerprintType as never,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.json({ success: true, data: result.rules, pagination: result.pagination });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async discover(req: Request, res: Response) {
    try {
      const data = await botManagerService.discoverFingerprints({
        limit: parseInt(req.query.limit as string) || 50,
        minCount: parseInt(req.query.minCount as string) || 1,
      });
      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await botManagerService.getAnalytics({
        domain: req.query.domain as string,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const botManagerController = new BotManagerController();
