import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    return this.usersRepository.save(user);
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
