import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRoleService } from '@/modules/rbac/services/user-role.service';

import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/users.entity';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => UserRoleService))
    private readonly userRoleService: UserRoleService,
  ) {}

  async createUser(input: CreateUserInput) {
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.usersRepository.create({
      email: input.email,
      passwordHash: input.passwordHash,
    });

    const saved = await this.usersRepository.save(user);
    await this.userRoleService.assignDefaultUserRole(saved.id);
    return saved;
  }

  async findUserByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findUserById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getUsers() {
    return this.usersRepository.find();
  }

  async getUserById(id: string) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(id: string) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.remove(user);
  }

  async updateUser(id: string, user: UpdateUserDto) {
    const existingUser = await this.findUserById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.update(id, user);
  }
}
