import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Food } from '../models/Food.js';
import { Poll } from '../models/Poll.js';
import { AuditLog } from '../models/AuditLog.js';
import * as imageService from '../services/imageService.js';

export async function getFoods(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, category, activeOnly = 'false' } = req.query;

    const query: any = {};
    if (activeOnly === 'true') {
      query.active = true;
    }
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: new RegExp(String(search), 'i') },
        { description: new RegExp(String(search), 'i') }
      ];
    }

    const foods = await Food.find(query).sort({ name: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: foods
    });
  } catch (error) {
    next(error);
  }
}

export async function createFood(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const food = new Food({
      ...req.body,
      createdBy: new Types.ObjectId(req.user!.userId)
    });
    await food.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'FOOD_CREATED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Created food item "${food.name}" in catalog.`
    });

    res.status(201).json({
      success: true,
      message: 'Food item created successfully.',
      data: food
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFood(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid food ID', code: 'INVALID_ID' });
      return;
    }

    const food = await Food.findById(id);
    if (!food) {
      res.status(404).json({ success: false, message: 'Food item not found', code: 'FOOD_NOT_FOUND' });
      return;
    }

    Object.assign(food, req.body);
    await food.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'FOOD_UPDATED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Updated food item "${food.name}".`
    });

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully.',
      data: food
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFood(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid food ID', code: 'INVALID_ID' });
      return;
    }

    const food = await Food.findById(id);
    if (!food) {
      res.status(404).json({ success: false, message: 'Food item not found', code: 'FOOD_NOT_FOUND' });
      return;
    }

    const deletedFoodName = food.name;
    const foodObjectId = new Types.ObjectId(id);

    // Check if food item is actively referenced in any historical polls
    const referencedPollCount = await Poll.countDocuments({
      'options.foodId': foodObjectId
    });

    // Hard delete the food item from the catalog.
    // Note: All historical Poll documents store immutable snapshots (foodNameSnapshot, foodImageSnapshot),
    // so historical polls remain 100% intact even after catalog deletion!
    await Food.findByIdAndDelete(id);

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'FOOD_DEACTIVATED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: referencedPollCount > 0
        ? `Deleted food item "${deletedFoodName}" from catalog. Referenced in ${referencedPollCount} historical polls (snapshots preserved).`
        : `Permanently removed food item "${deletedFoodName}" from catalog.`,
      metadata: { deletedFoodName, referencedPollCount }
    });

    res.status(200).json({
      success: true,
      message: referencedPollCount > 0
        ? `"${deletedFoodName}" removed from catalog. Historical polls using this dish remain fully preserved.`
        : `"${deletedFoodName}" has been removed from your food catalog.`
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadFoodImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided in request.',
        code: 'NO_FILE'
      });
      return;
    }

    const result = await imageService.uploadImage(req.file, req.body?.customName);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
