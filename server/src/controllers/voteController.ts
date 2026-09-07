import { Request, Response, NextFunction } from 'express';
import * as voteService from '../services/voteService.js';

export async function submitVote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: pollId } = req.params;
    const { selectedOptionId } = req.body;
    const userId = req.user!.userId;
    const clientContext = req.clientContext!;

    const result = await voteService.castVote(
      { pollId, selectedOptionId },
      userId,
      clientContext
    );

    res.status(200).json({
      success: true,
      message: result.isUpdate
        ? `Your vote has been updated to "${result.selectedOptionName}".`
        : `Your vote for "${result.selectedOptionName}" has been successfully recorded.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyVote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: pollId } = req.params;
    const vote = await voteService.getEmployeeVoteForPoll(pollId, req.user!.userId);

    res.status(200).json({
      success: true,
      data: vote
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyVoteHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await voteService.getEmployeeVoteHistory(req.user!.userId);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}
