/* eslint-disable import/no-cycle */
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
  Table,
  Unique,
} from '@sequelize/core/decorators-legacy';
import { Tagged } from 'type-fest';
import { v4 as uuidv4 } from 'uuid';

export type UserId = Tagged<string, 'UserId'>;

export const getUserId = () => uuidv4() as UserId;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ADMIN_USER_ID = 'admin' as UserId;
/**
 * Users is a special case which does not have created_by, updated_by, deleted_by, deleted_at,
 * so it does not extend EntityModel or MigrationYearModel.
 */
@Table({
  timestamps: true,
  freezeTableName: true,
  tableName: 'users',
})
export class UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  /**
   * The unique identifier for the user
   */
  @PrimaryKey
  @Attribute(DataTypes.STRING)
  @NotNull
  @Default(() => getUserId())
  @Unique
  declare user_id: CreationOptional<UserId>;

  /**
   * The email of the user; email notifications can be sent to this address
   */
  @Attribute(DataTypes.STRING)
  @NotNull
  declare email: string;

  /**
   * The last time the user was active
   * ISO 8601 string
   */
  @Attribute(DataTypes.DATE)
  @AllowNull
  declare last_active_at: Date | null;

  /**
   * Auth email is verified status
   */
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  declare auth_email_verified: CreationOptional<boolean>;

  /**
   * Auth password hash
   */
  @Attribute(DataTypes.STRING)
  @AllowNull
  declare auth_password_hash: string | null;

  /**
   * The user's refresh token
   */
  @Attribute(DataTypes.TEXT)
  @AllowNull
  declare auth_refresh_token: string | null;

  /**
   * The user's TOTP secret
   */
  @Attribute(DataTypes.STRING)
  @NotNull
  declare auth_totp_secret: string;

  /**
   * The user's TOTP enabled status
   */
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  declare auth_totp_enabled: CreationOptional<boolean>;

  /**
   * The last time 2FA was verified
   */
  @Attribute(DataTypes.DATE)
  declare auth_totp_verified_at: Date | null;
}

export type User = Partial<InferAttributes<UserModel>>;
