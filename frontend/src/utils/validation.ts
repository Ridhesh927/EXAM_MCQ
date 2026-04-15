import { z } from 'zod';

export const getLoginSchema = (role: 'student' | 'teacher') => {
    if (role === 'teacher') {
        return z.object({
            identifier: z
                .string()
                .trim()
                .min(1, 'Email is required')
                .email('Please enter a valid email address'),
            password: z.string().trim().min(1, 'Password is required'),
        });
    }

    return z.object({
        identifier: z.string().trim().min(1, 'PRN is required'),
        password: z.string().trim().min(1, 'Password is required'),
    });
};

export const aiGenerationInputSchema = z
    .object({
        context: z.string(),
        hasFile: z.boolean(),
        category: z.string(),
        count: z.number().int().min(1).max(20),
        difficulty: z.enum(['Easy', 'Medium', 'Hard']),
        provider: z.enum(['auto', 'groq', 'gemini', 'k2']),
    })
    .superRefine((data, ctx) => {
        const hasContext = data.context.trim().length > 0;
        const hasCategory = data.category.trim().length > 0;

        if (!hasContext && !data.hasFile && !hasCategory) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Please provide context, upload a file, or select a category.',
                path: ['context'],
            });
        }
    });

const AI_ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const AI_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const aiUploadFileSchema = z
    .custom<File>((file) => file instanceof File, {
        message: 'Please upload a valid file.',
    })
    .refine((file) => AI_ALLOWED_FILE_TYPES.includes(file.type), {
        message: 'Invalid file type. Please upload PDF, JPG, or PNG.',
    })
    .refine((file) => file.size <= AI_MAX_FILE_SIZE_BYTES, {
        message: 'File too large. Max size is 5MB.',
    });
