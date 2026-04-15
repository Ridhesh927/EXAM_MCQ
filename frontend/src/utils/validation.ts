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
        count: z.number().int().min(1).max(50),
        difficulty: z.enum(['Easy', 'Medium', 'Hard', 'High']),
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

const AI_ALLOWED_FILE_TYPES = [
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-excel'
];
const AI_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const aiUploadFileSchema = z
    .custom<File>((file) => file instanceof File, {
        message: 'Please upload a valid file.',
    })
    .refine((file) => {
        // Some browsers don't provide a mime type for some extensions
        const name = file.name.toLowerCase();
        const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png'];
        return AI_ALLOWED_FILE_TYPES.includes(file.type) || allowedExtensions.some(ext => name.endsWith(ext));
    }, {
        message: 'Invalid file type. Please upload PDF, Word, Excel, CSV, or Image.',
    })
    .refine((file) => file.size <= AI_MAX_FILE_SIZE_BYTES, {
        message: 'File too large. Max size is 5MB.',
    });
