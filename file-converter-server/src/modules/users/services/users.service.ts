import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}
