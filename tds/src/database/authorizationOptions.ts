import mongoose from 'mongoose';
import { Authorization, EmailsAuthOptions, KeybaseAuthOptions, Voting } from '@stellot/types';
import { KEYBASE_AUTH_OPTIONS, EMAILS_AUTH_OPTIONS } from './models';

const KeybaseAuthOptionsSchema = mongoose.model(KEYBASE_AUTH_OPTIONS);
const EmailsAuthOptionsSchema = mongoose.model(EMAILS_AUTH_OPTIONS);

export async function getAuthorizationOptions(voting: Omit<Voting, 'authorizationOptions'>): Promise<object | null> {
    switch (voting.authorization) {
        case Authorization.KEYBASE:
            return (await KeybaseAuthOptionsSchema.findOne({ voting: voting.id }))?.toJSON();
        case Authorization.EMAILS:
            return (await EmailsAuthOptionsSchema.findOne({ voting: voting.id }))?.toJSON();
        default:
            return null;
    }
}

export async function saveAuthorizationOptions(
    voting: Omit<Omit<Voting, 'authorizationOptions'>, 'ipfsCid'>,
    authorizationOptions: EmailsAuthOptions | KeybaseAuthOptions | undefined) {
    if (authorizationOptions) {
        if (voting.authorization === Authorization.KEYBASE) {
            const authKeybaseOptions =
                new KeybaseAuthOptionsSchema({ voting: voting.id, ...authorizationOptions });
            await authKeybaseOptions.save();
        } else if (voting.authorization === Authorization.EMAILS) {
            const authKeybaseOptions =
                new EmailsAuthOptionsSchema({ voting: voting.id, ...authorizationOptions });
            await authKeybaseOptions.save();
        }
    }
}

