import dbConnect from '@/lib/dbconnect';
import UserModel from '@/model/User';

export async function POST(request: Request) {
  await dbConnect();
    let username: string = '';
  let code: string = '';
  try {
    const { username, code } = await request.json();
    if (!username || !code) {
      return Response.json(
        { success: false, message: 'Username and code are required' },
        { status: 400 }
      );
    }

    const decodedUsername = decodeURIComponent(username);
    console.log('Looking up user with username:', decodedUsername);
    const user = await UserModel.findOne({ username: decodedUsername });
    console.log('User found:', user);

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const isCodeValid = user.verifyCode === String(code);
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date(Date.now());

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();
      console.log('User updated:', { username: user.username, isVerified: user.isVerified });
      return Response.json(
        { success: true, message: 'Account verified successfully' },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message: 'Verification code has expired. Please sign up again to get a new code.',
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        { success: false, message: 'Incorrect verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying user:', error, { username, code });
    return Response.json(
      { success: false, message: 'Error verifying user' },
      { status: 500 }
    );
  }
}