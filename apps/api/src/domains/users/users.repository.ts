import prisma from '../../config/database';
import { User, UserWithProfile, USER_SELECT_FIELDS, USER_WITH_PROFILE_SELECT_FIELDS } from './users.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserStatus } from '../../shared/types/common.types';

/**
 * User repository - handles all database operations for users
 */
export class UsersRepository {
  /**
   * Find all users with optional filters
   */
  async findAll(filters: UserQueryDto): Promise<User[]> {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: USER_SELECT_FIELDS,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      select: USER_WITH_PROFILE_SELECT_FIELDS,
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Check if username or email exists
   */
  async findByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Create new user
   */
  async create(data: CreateUserDto & { password: string }): Promise<User> {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role || 'viewer',
        status: data.status || 'active',
        phone: data.phone,
        timezone: data.timezone || 'Asia/Ho_Chi_Minh',
        language: data.language || 'en',
      },
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    const updateData: any = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.role !== undefined) updateData.role = data.role as any;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: USER_SELECT_FIELDS,
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count users
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Count users by status
   */
  async countByStatus(status: UserStatus): Promise<number> {
    return prisma.user.count({
      where: { status },
    });
  }

  /**
   * Count users by role
   */
  async countByRole(role: string): Promise<number> {
    return prisma.user.count({
      where: { role: role as any },
    });
  }

  /**
   * Count recent logins (last 24 hours)
   */
  async countRecentLogins(): Promise<number> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return prisma.user.count({
      where: {
        lastLogin: {
          gte: yesterday,
        },
      },
    });
  }
}

// Export singleton instance
export const usersRepository = new UsersRepository();
