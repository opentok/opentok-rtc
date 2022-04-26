/* eslint-disable max-len */
/* eslint-disable new-cap */
/* global Utils, RoomStatus, RoomView, LazyLoader, Modal,
ChatController, GoogleAuth, LayoutMenuController, OTHelper, PrecallController,
RecordingsController, ScreenShareController, FeedbackController,
PhoneNumberController, ResizeSensor, maxUsersPerRoom */
const TRIANGULATION = [
  127, 34, 139, 11, 0, 37, 232, 231, 120, 72, 37, 39, 128, 121, 47, 232, 121,
  128, 104, 69, 67, 175, 171, 148, 157, 154, 155, 118, 50, 101, 73, 39, 40, 9,
  151, 108, 48, 115, 131, 194, 204, 211, 74, 40, 185, 80, 42, 183, 40, 92,
  186, 230, 229, 118, 202, 212, 214, 83, 18, 17, 76, 61, 146, 160, 29, 30, 56,
  157, 173, 106, 204, 194, 135, 214, 192, 203, 165, 98, 21, 71, 68, 51, 45, 4,
  144, 24, 23, 77, 146, 91, 205, 50, 187, 201, 200, 18, 91, 106, 182, 90, 91,
  181, 85, 84, 17, 206, 203, 36, 148, 171, 140, 92, 40, 39, 193, 189, 244,
  159, 158, 28, 247, 246, 161, 236, 3, 196, 54, 68, 104, 193, 168, 8, 117,
  228, 31, 189, 193, 55, 98, 97, 99, 126, 47, 100, 166, 79, 218, 155, 154, 26,
  209, 49, 131, 135, 136, 150, 47, 126, 217, 223, 52, 53, 45, 51, 134, 211,
  170, 140, 67, 69, 108, 43, 106, 91, 230, 119, 120, 226, 130, 247, 63, 53,
  52, 238, 20, 242, 46, 70, 156, 78, 62, 96, 46, 53, 63, 143, 34, 227, 173,
  155, 133, 123, 117, 111, 44, 125, 19, 236, 134, 51, 216, 206, 205, 154, 153,
  22, 39, 37, 167, 200, 201, 208, 36, 142, 100, 57, 212, 202, 20, 60, 99, 28,
  158, 157, 35, 226, 113, 160, 159, 27, 204, 202, 210, 113, 225, 46, 43, 202,
  204, 62, 76, 77, 137, 123, 116, 41, 38, 72, 203, 129, 142, 64, 98, 240, 49,
  102, 64, 41, 73, 74, 212, 216, 207, 42, 74, 184, 169, 170, 211, 170, 149,
  176, 105, 66, 69, 122, 6, 168, 123, 147, 187, 96, 77, 90, 65, 55, 107, 89,
  90, 180, 101, 100, 120, 63, 105, 104, 93, 137, 227, 15, 86, 85, 129, 102,
  49, 14, 87, 86, 55, 8, 9, 100, 47, 121, 145, 23, 22, 88, 89, 179, 6, 122,
  196, 88, 95, 96, 138, 172, 136, 215, 58, 172, 115, 48, 219, 42, 80, 81, 195,
  3, 51, 43, 146, 61, 171, 175, 199, 81, 82, 38, 53, 46, 225, 144, 163, 110,
  246, 33, 7, 52, 65, 66, 229, 228, 117, 34, 127, 234, 107, 108, 69, 109, 108,
  151, 48, 64, 235, 62, 78, 191, 129, 209, 126, 111, 35, 143, 163, 161, 246,
  117, 123, 50, 222, 65, 52, 19, 125, 141, 221, 55, 65, 3, 195, 197, 25, 7,
  33, 220, 237, 44, 70, 71, 139, 122, 193, 245, 247, 130, 33, 71, 21, 162,
  153, 158, 159, 170, 169, 150, 188, 174, 196, 216, 186, 92, 144, 160, 161, 2,
  97, 167, 141, 125, 241, 164, 167, 37, 72, 38, 12, 145, 159, 160, 38, 82, 13,
  63, 68, 71, 226, 35, 111, 158, 153, 154, 101, 50, 205, 206, 92, 165, 209,
  198, 217, 165, 167, 97, 220, 115, 218, 133, 112, 243, 239, 238, 241, 214,
  135, 169, 190, 173, 133, 171, 208, 32, 125, 44, 237, 86, 87, 178, 85, 86,
  179, 84, 85, 180, 83, 84, 181, 201, 83, 182, 137, 93, 132, 76, 62, 183, 61,
  76, 184, 57, 61, 185, 212, 57, 186, 214, 207, 187, 34, 143, 156, 79, 239,
  237, 123, 137, 177, 44, 1, 4, 201, 194, 32, 64, 102, 129, 213, 215, 138, 59,
  166, 219, 242, 99, 97, 2, 94, 141, 75, 59, 235, 24, 110, 228, 25, 130, 226,
  23, 24, 229, 22, 23, 230, 26, 22, 231, 112, 26, 232, 189, 190, 243, 221, 56,
  190, 28, 56, 221, 27, 28, 222, 29, 27, 223, 30, 29, 224, 247, 30, 225, 238,
  79, 20, 166, 59, 75, 60, 75, 240, 147, 177, 215, 20, 79, 166, 187, 147, 213,
  112, 233, 244, 233, 128, 245, 128, 114, 188, 114, 217, 174, 131, 115, 220,
  217, 198, 236, 198, 131, 134, 177, 132, 58, 143, 35, 124, 110, 163, 7, 228,
  110, 25, 356, 389, 368, 11, 302, 267, 452, 350, 349, 302, 303, 269, 357,
  343, 277, 452, 453, 357, 333, 332, 297, 175, 152, 377, 384, 398, 382, 347,
  348, 330, 303, 304, 270, 9, 336, 337, 278, 279, 360, 418, 262, 431, 304,
  408, 409, 310, 415, 407, 270, 409, 410, 450, 348, 347, 422, 430, 434, 313,
  314, 17, 306, 307, 375, 387, 388, 260, 286, 414, 398, 335, 406, 418, 364,
  367, 416, 423, 358, 327, 251, 284, 298, 281, 5, 4, 373, 374, 253, 307, 320,
  321, 425, 427, 411, 421, 313, 18, 321, 405, 406, 320, 404, 405, 315, 16, 17,
  426, 425, 266, 377, 400, 369, 322, 391, 269, 417, 465, 464, 386, 257, 258,
  466, 260, 388, 456, 399, 419, 284, 332, 333, 417, 285, 8, 346, 340, 261,
  413, 441, 285, 327, 460, 328, 355, 371, 329, 392, 439, 438, 382, 341, 256,
  429, 420, 360, 364, 394, 379, 277, 343, 437, 443, 444, 283, 275, 440, 363,
  431, 262, 369, 297, 338, 337, 273, 375, 321, 450, 451, 349, 446, 342, 467,
  293, 334, 282, 458, 461, 462, 276, 353, 383, 308, 324, 325, 276, 300, 293,
  372, 345, 447, 382, 398, 362, 352, 345, 340, 274, 1, 19, 456, 248, 281, 436,
  427, 425, 381, 256, 252, 269, 391, 393, 200, 199, 428, 266, 330, 329, 287,
  273, 422, 250, 462, 328, 258, 286, 384, 265, 353, 342, 387, 259, 257, 424,
  431, 430, 342, 353, 276, 273, 335, 424, 292, 325, 307, 366, 447, 345, 271,
  303, 302, 423, 266, 371, 294, 455, 460, 279, 278, 294, 271, 272, 304, 432,
  434, 427, 272, 407, 408, 394, 430, 431, 395, 369, 400, 334, 333, 299, 351,
  417, 168, 352, 280, 411, 325, 319, 320, 295, 296, 336, 319, 403, 404, 330,
  348, 349, 293, 298, 333, 323, 454, 447, 15, 16, 315, 358, 429, 279, 14, 15,
  316, 285, 336, 9, 329, 349, 350, 374, 380, 252, 318, 402, 403, 6, 197, 419,
  318, 319, 325, 367, 364, 365, 435, 367, 397, 344, 438, 439, 272, 271, 311,
  195, 5, 281, 273, 287, 291, 396, 428, 199, 311, 271, 268, 283, 444, 445,
  373, 254, 339, 263, 466, 249, 282, 334, 296, 449, 347, 346, 264, 447, 454,
  336, 296, 299, 338, 10, 151, 278, 439, 455, 292, 407, 415, 358, 371, 355,
  340, 345, 372, 390, 249, 466, 346, 347, 280, 442, 443, 282, 19, 94, 370,
  441, 442, 295, 248, 419, 197, 263, 255, 359, 440, 275, 274, 300, 383, 368,
  351, 412, 465, 263, 467, 466, 301, 368, 389, 380, 374, 386, 395, 378, 379,
  412, 351, 419, 436, 426, 322, 373, 390, 388, 2, 164, 393, 370, 462, 461,
  164, 0, 267, 302, 11, 12, 374, 373, 387, 268, 12, 13, 293, 300, 301, 446,
  261, 340, 385, 384, 381, 330, 266, 425, 426, 423, 391, 429, 355, 437, 391,
  327, 326, 440, 457, 438, 341, 382, 362, 459, 457, 461, 434, 430, 394, 414,
  463, 362, 396, 369, 262, 354, 461, 457, 316, 403, 402, 315, 404, 403, 314,
  405, 404, 313, 406, 405, 421, 418, 406, 366, 401, 361, 306, 408, 407, 291,
  409, 408, 287, 410, 409, 432, 436, 410, 434, 416, 411, 264, 368, 383, 309,
  438, 457, 352, 376, 401, 274, 275, 4, 421, 428, 262, 294, 327, 358, 433,
  416, 367, 289, 455, 439, 462, 370, 326, 2, 326, 370, 305, 460, 455, 254,
  449, 448, 255, 261, 446, 253, 450, 449, 252, 451, 450, 256, 452, 451, 341,
  453, 452, 413, 464, 463, 441, 413, 414, 258, 442, 441, 257, 443, 442, 259,
  444, 443, 260, 445, 444, 467, 342, 445, 459, 458, 250, 289, 392, 290, 290,
  328, 460, 376, 433, 435, 250, 290, 392, 411, 416, 433, 341, 463, 464, 453,
  464, 465, 357, 465, 412, 343, 412, 399, 360, 363, 440, 437, 399, 456, 420,
  456, 363, 401, 435, 288, 372, 383, 353, 339, 255, 249, 448, 261, 255, 133,
  243, 190, 133, 155, 112, 33, 246, 247, 33, 130, 25, 398, 384, 286, 362, 398,
  414, 362, 463, 341, 263, 359, 467, 263, 249, 255, 466, 467, 260, 75, 60,
  166, 238, 239, 79, 162, 127, 139, 72, 11, 37, 121, 232, 120, 73, 72, 39,
  114, 128, 47, 233, 232, 128, 103, 104, 67, 152, 175, 148, 173, 157, 155,
  119, 118, 101, 74, 73, 40, 107, 9, 108, 49, 48, 131, 32, 194, 211, 184, 74,
  185, 191, 80, 183, 185, 40, 186, 119, 230, 118, 210, 202, 214, 84, 83, 17,
  77, 76, 146, 161, 160, 30, 190, 56, 173, 182, 106, 194, 138, 135, 192, 129,
  203, 98, 54, 21, 68, 5, 51, 4, 145, 144, 23, 90, 77, 91, 207, 205, 187, 83,
  201, 18, 181, 91, 182, 180, 90, 181, 16, 85, 17, 205, 206, 36, 176, 148,
  140, 165, 92, 39, 245, 193, 244, 27, 159, 28, 30, 247, 161, 174, 236, 196,
  103, 54, 104, 55, 193, 8, 111, 117, 31, 221, 189, 55, 240, 98, 99, 142, 126,
  100, 219, 166, 218, 112, 155, 26, 198, 209, 131, 169, 135, 150, 114, 47,
  217, 224, 223, 53, 220, 45, 134, 32, 211, 140, 109, 67, 108, 146, 43, 91,
  231, 230, 120, 113, 226, 247, 105, 63, 52, 241, 238, 242, 124, 46, 156, 95,
  78, 96, 70, 46, 63, 116, 143, 227, 116, 123, 111, 1, 44, 19, 3, 236, 51,
  207, 216, 205, 26, 154, 22, 165, 39, 167, 199, 200, 208, 101, 36, 100, 43,
  57, 202, 242, 20, 99, 56, 28, 157, 124, 35, 113, 29, 160, 27, 211, 204, 210,
  124, 113, 46, 106, 43, 204, 96, 62, 77, 227, 137, 116, 73, 41, 72, 36, 203,
  142, 235, 64, 240, 48, 49, 64, 42, 41, 74, 214, 212, 207, 183, 42, 184, 210,
  169, 211, 140, 170, 176, 104, 105, 69, 193, 122, 168, 50, 123, 187, 89, 96,
  90, 66, 65, 107, 179, 89, 180, 119, 101, 120, 68, 63, 104, 234, 93, 227, 16,
  15, 85, 209, 129, 49, 15, 14, 86, 107, 55, 9, 120, 100, 121, 153, 145, 22,
  178, 88, 179, 197, 6, 196, 89, 88, 96, 135, 138, 136, 138, 215, 172, 218,
  115, 219, 41, 42, 81, 5, 195, 51, 57, 43, 61, 208, 171, 199, 41, 81, 38,
  224, 53, 225, 24, 144, 110, 105, 52, 66, 118, 229, 117, 227, 34, 234, 66,
  107, 69, 10, 109, 151, 219, 48, 235, 183, 62, 191, 142, 129, 126, 116, 111,
  143, 7, 163, 246, 118, 117, 50, 223, 222, 52, 94, 19, 141, 222, 221, 65,
  196, 3, 197, 45, 220, 44, 156, 70, 139, 188, 122, 245, 139, 71, 162, 145,
  153, 159, 149, 170, 150, 122, 188, 196, 206, 216, 92, 163, 144, 161, 164, 2,
  167, 242, 141, 241, 0, 164, 37, 11, 72, 12, 144, 145, 160, 12, 38, 13, 70,
  63, 71, 31, 226, 111, 157, 158, 154, 36, 101, 205, 203, 206, 165, 126, 209,
  217, 98, 165, 97, 237, 220, 218, 237, 239, 241, 210, 214, 169, 140, 171, 32,
  241, 125, 237, 179, 86, 178, 180, 85, 179, 181, 84, 180, 182, 83, 181, 194,
  201, 182, 177, 137, 132, 184, 76, 183, 185, 61, 184, 186, 57, 185, 216, 212,
  186, 192, 214, 187, 139, 34, 156, 218, 79, 237, 147, 123, 177, 45, 44, 4,
  208, 201, 32, 98, 64, 129, 192, 213, 138, 235, 59, 219, 141, 242, 97, 97, 2,
  141, 240, 75, 235, 229, 24, 228, 31, 25, 226, 230, 23, 229, 231, 22, 230,
  232, 26, 231, 233, 112, 232, 244, 189, 243, 189, 221, 190, 222, 28, 221,
  223, 27, 222, 224, 29, 223, 225, 30, 224, 113, 247, 225, 99, 60, 240, 213,
  147, 215, 60, 20, 166, 192, 187, 213, 243, 112, 244, 244, 233, 245, 245,
  128, 188, 188, 114, 174, 134, 131, 220, 174, 217, 236, 236, 198, 134, 215,
  177, 58, 156, 143, 124, 25, 110, 7, 31, 228, 25, 264, 356, 368, 0, 11, 267,
  451, 452, 349, 267, 302, 269, 350, 357, 277, 350, 452, 357, 299, 333, 297,
  396, 175, 377, 381, 384, 382, 280, 347, 330, 269, 303, 270, 151, 9, 337,
  344, 278, 360, 424, 418, 431, 270, 304, 409, 272, 310, 407, 322, 270, 410,
  449, 450, 347, 432, 422, 434, 18, 313, 17, 291, 306, 375, 259, 387, 260,
  424, 335, 418, 434, 364, 416, 391, 423, 327, 301, 251, 298, 275, 281, 4,
  254, 373, 253, 375, 307, 321, 280, 425, 411, 200, 421, 18, 335, 321, 406,
  321, 320, 405, 314, 315, 17, 423, 426, 266, 396, 377, 369, 270, 322, 269,
  413, 417, 464, 385, 386, 258, 248, 456, 419, 298, 284, 333, 168, 417, 8,
  448, 346, 261, 417, 413, 285, 326, 327, 328, 277, 355, 329, 309, 392, 438,
  381, 382, 256, 279, 429, 360, 365, 364, 379, 355, 277, 437, 282, 443, 283,
  281, 275, 363, 395, 431, 369, 299, 297, 337, 335, 273, 321, 348, 450, 349,
  359, 446, 467, 283, 293, 282, 250, 458, 462, 300, 276, 383, 292, 308, 325,
  283, 276, 293, 264, 372, 447, 346, 352, 340, 354, 274, 19, 363, 456, 281,
  426, 436, 425, 380, 381, 252, 267, 269, 393, 421, 200, 428, 371, 266, 329,
  432, 287, 422, 290, 250, 328, 385, 258, 384, 446, 265, 342, 386, 387, 257,
  422, 424, 430, 445, 342, 276, 422, 273, 424, 306, 292, 307, 352, 366, 345,
  268, 271, 302, 358, 423, 371, 327, 294, 460, 331, 279, 294, 303, 271, 304,
  436, 432, 427, 304, 272, 408, 395, 394, 431, 378, 395, 400, 296, 334, 299,
  6, 351, 168, 376, 352, 411, 307, 325, 320, 285, 295, 336, 320, 319, 404,
  329, 330, 349, 334, 293, 333, 366, 323, 447, 316, 15, 315, 331, 358, 279,
  317, 14, 316, 8, 285, 9, 277, 329, 350, 253, 374, 252, 319, 318, 403, 351,
  6, 419, 324, 318, 325, 397, 367, 365, 288, 435, 397, 278, 344, 439, 310,
  272, 311, 248, 195, 281, 375, 273, 291, 175, 396, 199, 312, 311, 268, 276,
  283, 445, 390, 373, 339, 295, 282, 296, 448, 449, 346, 356, 264, 454, 337,
  336, 299, 337, 338, 151, 294, 278, 455, 308, 292, 415, 429, 358, 355, 265,
  340, 372, 388, 390, 466, 352, 346, 280, 295, 442, 282, 354, 19, 370, 285,
  441, 295, 195, 248, 197, 457, 440, 274, 301, 300, 368, 417, 351, 465, 251,
  301, 389, 385, 380, 386, 394, 395, 379, 399, 412, 419, 410, 436, 322, 387,
  373, 388, 326, 2, 393, 354, 370, 461, 393, 164, 267, 268, 302, 12, 386, 374,
  387, 312, 268, 13, 298, 293, 301, 265, 446, 340, 380, 385, 381, 280, 330,
  425, 322, 426, 391, 420, 429, 437, 393, 391, 326, 344, 440, 438, 458, 459,
  461, 364, 434, 394, 428, 396, 262, 274, 354, 457, 317, 316, 402, 316, 315,
  403, 315, 314, 404, 314, 313, 405, 313, 421, 406, 323, 366, 361, 292, 306,
  407, 306, 291, 408, 291, 287, 409, 287, 432, 410, 427, 434, 411, 372, 264,
  383, 459, 309, 457, 366, 352, 401, 1, 274, 4, 418, 421, 262, 331, 294, 358,
  435, 433, 367, 392, 289, 439, 328, 462, 326, 94, 2, 370, 289, 305, 455, 339,
  254, 448, 359, 255, 446, 254, 253, 449, 253, 252, 450, 252, 256, 451, 256,
  341, 452, 414, 413, 463, 286, 441, 414, 286, 258, 441, 258, 257, 442, 257,
  259, 443, 259, 260, 444, 260, 467, 445, 309, 459, 250, 305, 289, 290, 305,
  290, 460, 401, 376, 435, 309, 250, 392, 376, 411, 433, 453, 341, 464, 357,
  453, 465, 343, 357, 412, 437, 343, 399, 344, 360, 440, 420, 437, 456, 360,
  420, 363, 361, 401, 288, 265, 372, 353, 390, 339, 249, 339, 448, 255];
let chartInit = false;
const dataSets = {};
let myChart;
let chartData;
let chartTimeoutHandler;
const groupBy = (xs, key) => xs.reduce((rv, x) => {
  (rv[x[key]] = rv[x[key]] || []).push(x);
  return rv;
}, {});
const getColor = (value) => {
  const hue = (value * 120).toString(10);
  return ['hsl(', hue, ',100%,50%)'].join('');
};
const attentionMap = (score) => {
  const percentage = score / 4;
  const color = getColor(percentage);
  if (score < 2.0) {
    return {
      label: 'NO ATTENTION',
      color,
    };
  }

  if (score < 2.5) {
    return {
      label: 'BAD ATTENTION',
      color,
    };
  }

  if (score < 3.5) {
    return {
      label: 'GOOD ATTENTION',
      color,
    };
  }

  if (score <= 4.0) {
    return {
      label: 'PERFECT ATTENTION',
      color,
    };
  }

  return {
    label: 'NO ATTENTION',
    color,
  };
};

!((exports) => {
  const debug = new Utils.MultiLevelLogger('roomController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  let otHelper;
  let numUsrsInRoom = 0;
  let _disabledAllVideos = false;
  let enableAnnotations = true;
  let enableHangoutScroll = false;
  let enableArchiveManager = false;
  let enableSip = false;
  let requireGoogleAuth = false; // For SIP dial-out
  let googleAuth = null;
  let streamId = null;
  const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  MicroModal.init();

  let setPublisherReady;
  const publisherReady = new Promise((resolve) => {
    setPublisherReady = resolve;
  });

  const STATUS_KEY = 'room';
  let _sharedStatus = {
    roomMuted: false,
  };

  let { userName } = window;
  let roomURI = null;
  let token = null;

  const publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    showControls: true,
    resolution: window.publisherResolution,
    style: {
      audioLevelDisplayMode: 'auto',
      buttonDisplayMode: 'off',
      nameDisplayMode: 'off',
      videoDisabledDisplayMode: 'on',
      showArchiveStatus: false,
    },
  };

  const subscriberOptions = {
    camera: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: true,
      style: {
        audioLevelDisplayMode: 'auto',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off',
        videoDisabledDisplayMode: 'auto',
        showArchiveStatus: false,
      },
    },
    screen: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: false,
      style: {
        audioLevelDisplayMode: 'off',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off',
        videoDisabledDisplayMode: 'off',
      },
    },
    noVideo: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: true,
      style: {
        audioLevelDisplayMode: 'auto',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off',
        videoDisabledDisplayMode: 'off',
      },
    },
  };

  const ws = new WebSocket('ws://localhost:8000');

  ws.onopen = function (e) {
    console.log('Websocket opened');
  };
  ws.onmessage = function (event) {
    console.log('GOT MESSAGE FROM SERVER', JSON.parse(event.data));
    const streamData = JSON.parse(event.data);
    if (!chartInit) {
      const scorePointsWithTime = streamData.dataPoints.map((point) => {
        point = JSON.parse(point);
        return { x: point.timestamp, y: point.score, text: point.transcribeText };
      });
      dataSets[streamData.streamId] = {
        label: streamData.streamId,
        backgroundColor: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
        borderColor: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
        data: scorePointsWithTime,
      };

      chartData = {
        datasets: [dataSets[streamData.streamId]],
      };

      const config = {
        type: 'line',
        data: chartData,
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                // eslint-disable-next-line object-shorthand
                label: function (context, data) {
                  console.log('tooltiphere', data);
                  const label = context.dataset.label || '';

                  return label;
                },
              },
            },
          },
        },
      };

      myChart = new Chart(
        document.getElementById('myChart'),
        config,
      );
      chartInit = true;
    } else {
      const currDataSet = dataSets[streamData.streamId];
      const scorePointsWithTime = streamData.dataPoints.map((point) => {
        point = JSON.parse(point);
        return { x: point.timestamp, y: point.score };
      });

      if (currDataSet) {
        currDataSet.data = scorePointsWithTime;
        myChart.data.datasets.forEach((dataset) => {
          if (dataset.label === streamData.streamId) {
            dataset.data = scorePointsWithTime;
          }
        });
      } else {
        dataSets[streamData.streamId] = {
          label: streamData.streamId,
          backgroundColor: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
          borderColor: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
          data: scorePointsWithTime,
        };
        myChart.data.datasets.push(dataSets[streamData.streamId]);
      }
      myChart.update();
    }
    // const parsedData = (JSON.parse(event.data).dataPoints.map((x) => JSON.parse(x)));
    // const groupedValues = groupBy(parsedData.map((datum) => attentionMap(datum.score)), 'label');
    // console.log(groupedValues);
    // const chartData = Object.values(groupedValues).map((a) => a.length);
    // const chartLabels = Object.keys(groupedValues);
    // const data = {
    //   labels: chartLabels,
    //   datasets: [{
    //     label: 'Attention Overview',
    //     data: chartData,
    //   }],
    // };
    //
    // const config = {
    //   type: 'doughnut',
    //   data,
    //   options: {},
    // };
    //
    // if (myChart) {
    //   myChart.destroy();
    // }
    // myChart = new Chart(
    //   document.getElementById('myChart'),
    //   config,
    // );
  };

  ws.onclose = function (event) {
    if (event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log('[close] Connection died');
    }
  };

  ws.onerror = function (error) {
    console.log(`[error] ${error.message}`);
  };

  const runFacemesh = async (webcamRef) => {
    const net = await faceLandmarksDetection
      .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, { maxFaces: 1 });
    console.log('Facemech loaded');

    setInterval(() => {
      detect(net, webcamRef);
    }, 3000);
  };

  const radiansToDegrees = (radians) => {
    const pi = Math.PI;
    return radians * (180 / pi);
  };

  const getScore = (degree) => {
    degree = Math.abs(radiansToDegrees(degree));
    if (degree < 10) {
      return 2;
    }
    if (degree < 30) {
      const adjust = (degree - 10) * 0.05;
      return 2.0 - adjust;
    }
    return 0;
  };

  const drawPath = (ctx, points, closePath) => {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }

    if (closePath) {
      region.closePath();
    }
    ctx.strokeStyle = 'grey';
    ctx.stroke(region);
  };

  // Drawing Mesh
  const drawMesh = (predictions, ctx) => {
    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        const keypoints = prediction.scaledMesh;

        //  Draw Triangles
        for (let i = 0; i < TRIANGULATION.length / 3; i++) {
          // Get sets of three keypoints for the triangle
          const points = [
            TRIANGULATION[i * 3],
            TRIANGULATION[i * 3 + 1],
            TRIANGULATION[i * 3 + 2],
          ].map((index) => keypoints[index]);
          //  Draw triangle
          drawPath(ctx, points, true);
        }

        // Draw Dots
        for (let i = 0; i < keypoints.length; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          ctx.beginPath();
          ctx.arc(x, y, 1 /* radius */, 0, 3 * Math.PI);
          ctx.fillStyle = 'aqua';
          ctx.fill();
        }
      });
    }
  };

  const detect = async (net, webcamRef) => {
    if (
      typeof webcamRef !== 'undefined'
      && webcamRef !== null
      && webcamRef.readyState === 4
    ) {
      const video = webcamRef;
      const { videoWidth } = webcamRef;
      const { videoHeight } = webcamRef;
      webcamRef.width = videoWidth;
      webcamRef.height = videoHeight;

      const face = await net.estimateFaces({ input: video, predictIrises: true });

      const { mesh } = face[0];
      const { annotations } = face[0];
      const { boundingBox } = face[0];
      const {
        leftEyeIris, leftEyeUpper0,
      } = annotations;
      const leftIris = leftEyeIris[0];
      const leftEyeStart = leftEyeUpper0[0];

      const radians = (a1, a2, b1, b2) => Math.atan2(b2 - a2, b1 - a1);
      const angle = {
        roll: radians(mesh[33][0], mesh[33][1], mesh[263][0], mesh[263][1]),
        yaw: radians(mesh[33][0], mesh[33][2], mesh[263][0], mesh[263][2]),
        pitch: radians(mesh[10][1], mesh[10][2], mesh[152][1], mesh[152][2]),
      };
      const score = getScore(angle.yaw) * getScore(angle.pitch);

      ws.send(JSON.stringify({
        msg: 'SET-ATTENTION',
        score,
        streamId,
        roomURI,
        leftIris,
        leftEyeStart,
        boundingBox,
        transcribeText: $('#transcribe-result').val(),
      }));
      otHelper.sendSignal('attentionScore', { attention: score, streamId });
      // if (angle.yaw < -0.28) {
      //   console.log('Looking Right');
      //   otHelper.sendSignal('attentionBoolean', { attention: false, streamId });
      // } else if (angle.yaw > 0.27) {
      //   console.log('Looking Left');
      //   otHelper.sendSignal('attentionBoolean', { attention: false, streamId });
      // } else if (angle.pitch < -0.32) {
      //   console.log('looking up');
      //   otHelper.sendSignal('attentionBoolean', { attention: false, streamId });
      // } else if (angle.pitch > 0.30) {
      //   console.log('looking down');
      //   otHelper.sendSignal('attentionBoolean', { attention: false, streamId });
      // } else {
      //   console.log('looking straight');
      //   otHelper.sendSignal('attentionBoolean', { attention: true, streamId });
      // }
    }
  };

  const isMobile = () => typeof window.orientation !== 'undefined';

  const SubscriberButtons = (streamVideoType, phoneNumber) => {
    const isScreenSharing = streamVideoType === 'screen';

    const buttons = { };

    if (!phoneNumber) {
      buttons.video = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: isScreenSharing ? 'desktop' : 'video',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersVideo',
        enabled: true,
      };
    }

    if (!isScreenSharing) {
      buttons.audio = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'audio',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersAudio',
        enabled: true,
      };
    }
    if (phoneNumber && (phoneNumber in dialedNumberTokens)) {
      buttons.hangup = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'hangup',
        eventName: 'click',
        context: 'otHelper',
        action: 'hangup',
        enabled: true,
      };
    }

    return buttons;
  };

  const getDistance = (x, y) => {
    const y1 = x[0] - y[0];
    const x1 = x[1] - y[1];

    return Math.sqrt(x1 * x1 + y1 * y1);
  };

  const publisherButtons = {
    video: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'video',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherVideo',
      enabled: true,
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'mic',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherAudio',
      enabled: true,
    },
  };

  let subscriberStreams = { };
  const dialedNumberTokens = { };

  const sendVideoEvent = (stream) => {
    if (!stream) {
      return;
    }

    Utils.sendEvent(`roomController:${stream.hasVideo ? 'videoEnabled' : 'videoDisabled'}`, {
      id: stream.streamId,
    });
  };

  const sendArchivingOperation = (operation) => {
    const data = {
      userName,
      roomName: roomURI,
      operation,
    };

    Request.sendArchivingOperation(data);
  };

  const dialOut = (phoneNumber) => {
    const alreadyInCall = Object.keys(subscriberStreams)
      .some((streamId) => {
        if (subscriberStreams[streamId]) {
          const { stream } = subscriberStreams[streamId];
          return (stream.isSip && stream.name === phoneNumber);
        }
        return false;
      });

    if (alreadyInCall) {
      console.log(`The number is already in this call: ${phoneNumber}`); // eslint-disable-line no-console
    } else {
      let googleIdToken;
      if (requireGoogleAuth) {
        const user = googleAuth.currentUser.get();
        googleIdToken = user.getAuthResponse().id_token;
      } else {
        googleIdToken = '';
      }
      const data = {
        phoneNumber,
        googleIdToken,
      };
      Request.dialOut(roomURI, data);
      dialedNumberTokens[phoneNumber] = googleIdToken;
    }
  };

  const hangup = (streamId) => {
    if (!subscriberStreams[streamId]) {
      return;
    }
    const { stream } = subscriberStreams[streamId];
    if (!stream.isSip) {
      return;
    }
    const { phoneNumber } = stream;
    if (!(phoneNumber in dialedNumberTokens)) {
      return;
    }
    const token = dialedNumberTokens[phoneNumber];
    Request.hangUp(phoneNumber, token);
    delete dialedNumberTokens[phoneNumber];
  };

  const roomStatusHandlers = {
    updatedRemotely() {
      publisherReady.then(() => {
        _sharedStatus = RoomStatus.get(STATUS_KEY);
        const { roomMuted } = _sharedStatus;
        setAudioStatus(roomMuted);
        roomMuted && Utils.sendEvent('roomController:roomMuted', { isJoining: true });
      });
    },
  };

  const changeSubscriberStatus = (name, status) => {
    _disabledAllVideos = status;

    Object.keys(subscriberStreams).forEach((aStreamId) => {
      if (subscriberStreams[aStreamId]
          && subscriberStreams[aStreamId].stream.videoType === 'camera') {
        pushSubscriberButton(aStreamId, name, status);
      }
    });
  };

  const pushSubscriberButton = (streamId, name, status) => {
    viewEventHandlers.buttonClick({
      detail: {
        streamId,
        name,
        disableAll: true,
        status,
      },
    });
  };

  function sendSignalMuteAll(status, onlyChangeSwitch) {
    otHelper.sendSignal('muteAll', { status, onlyChangeSwitch });
  }

  function sendSignalLock(status) {
    otHelper.sendSignal('roomLocked', { status });
  }

  const viewEventHandlers = {
    openAttentionModal() {
      MicroModal.show('modal-1', {
        onClose: () => {
          clearInterval(chartTimeoutHandler);
        },
      });
      const requestIds = [...Object.keys(subscriberStreams), streamId];
      chartTimeoutHandler = setInterval(() => {
        requestIds.forEach((streamId) => {
          ws.send(JSON.stringify({ msg: 'GET-ATTENTION', streamId, roomURI }));
        });
      }, 3000);
    },
    endCall() {
      otHelper.disconnect();
      window.location = '/thanks';
    },
    startArchiving(evt) {
      sendArchivingOperation((evt.detail && evt.detail.operation) || 'startComposite');
    },
    stopArchiving() {
      sendArchivingOperation('stop');
    },
    toggleAttention() {
      console.log('Stream id', streamId);
      ws.send(JSON.stringify({ msg: 'GET-ATTENTION', streamId, roomURI }));
    },
    streamVisibilityChange(evt) {
      const getStatus = (info) => {
        let status = null;

        if (evt.detail.value === 'hidden') {
          info.prevEnabled = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          status = false;
        } else {
          status = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          delete info.prevEnabled;
        }

        return status;
      };

      const streamId = evt.detail.id;
      if (streamId !== 'publisher') {
        const stream = subscriberStreams[streamId];
        stream && otHelper.toggleSubscribersVideo(stream.stream,
          getStatus(stream.buttons.video));
      }
    },
    buttonClick(evt) {
      const { streamId } = evt.detail;
      const { streamType } = evt.detail;
      const { name } = evt.detail;
      const disableAll = !!evt.detail.disableAll;
      const switchStatus = evt.detail.status;
      let buttonInfo = null;
      const args = [];
      let newStatus;
      const isPublisher = streamId === 'publisher';

      if (isPublisher) {
        buttonInfo = publisherButtons[name];
        newStatus = !buttonInfo.enabled;
        // There are a couple of possible race conditions that would end on us not changing
        // the status on the publisher (because it's already on that state).
        if (!otHelper.isPublisherReady || otHelper.publisherHas(name) === newStatus) {
          return;
        }
      } else {
        const stream = subscriberStreams[streamId];
        if (!stream) {
          debug.error('Got an event from an nonexistent stream');
          return;
        }
        if (name === 'hangup') {
          hangup(streamId);
          return;
        }
        buttonInfo = stream.buttons[name];
        args.push(stream.stream);
        newStatus = !buttonInfo.enabled;
        // BUG xxxx - We don't receive videoDisabled/videoEnabled events when
        // stopping/starting the screen sharing video
        // OPENTOK-26021 - We don't receive any event when mute/unmute the audio in local streams
        if (streamType === 'screen' || name === 'audio') {
          // so we assume the operation was performed properly and change the UI status
          sendStatus({ stream: stream.stream }, name, newStatus);
        }
      }

      if (!buttonInfo) {
        debug.error('Got an event from an unknown button!');
        return;
      }

      args.push(newStatus);

      if (!disableAll || (disableAll && (switchStatus !== newStatus))) {
        const obj = exports[buttonInfo.context];
        obj[buttonInfo.action](...args);
        // if stream button clicked and isn't a screen
        if (!disableAll && streamType !== 'screen') {
          // If type = 'audio'
          //   it only has to propagate the change when the button clicked is the microphone
          // if type = 'video'
          //   only when button clicked is not the publisher's one (is a subscriber's video button)
          // it type = 'screen'
          //   don't do anything
          const isMicrophone = name === 'audio' && isPublisher;
          const isSubscribeToVideo = name === 'video' && !isPublisher;
          if (isMicrophone || isSubscribeToVideo) {
            Utils.sendEvent('roomController:userChangeStatus', { status: newStatus, name });
            if (isMicrophone) {
              sendSignalMuteAll(false, true);
              _sharedStatus.roomMuted = false;
            }
          }
        }
      }
    },
    videoSwitch(evt) {
      changeSubscriberStatus('video', evt.detail.status);
    },
    muteAllSwitch(evt) {
      const roomMuted = evt.detail.status;
      _sharedStatus.roomMuted = roomMuted;
      setAudioStatus(roomMuted);
      sendSignalMuteAll(roomMuted, false);
    },
    dialOut(evt) {
      if (evt.detail) {
        const phoneNumber = evt.detail.replace(/\D/g, '');
        if (requireGoogleAuth && (googleAuth.isSignedIn.get() !== true)) {
          googleAuth.signIn().then(() => {
            document.body.data('google-signed-in', 'true');
            dialOut(phoneNumber);
          });
        } else {
          dialOut(phoneNumber);
        }
      }
    },
    addToCall() {
      if (isMobile() && navigator.share) {
        showMobileShareUrl();
      } else {
        showAddToCallModal();
      }
    },
    togglePublisherAudio(evt) {
      const newStatus = evt.detail.hasAudio;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('audio') !== newStatus) {
        otHelper.togglePublisherAudio(newStatus);
      }
    },
    togglePublisherVideo(evt) {
      const newStatus = evt.detail.hasVideo;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('video') !== newStatus) {
        otHelper.togglePublisherVideo(newStatus);
      }
    },
    setRoomLockState(evt) {
      const state = evt.detail;
      const data = {
        userName,
        token,
        state,
        roomURI,
      };

      Request.sendLockingOperation(data).then(() => sendSignalLock(state));
    },
  };

  const setAudioStatus = (switchStatus) => {
    otHelper.isPublisherReady && viewEventHandlers.buttonClick({
      detail: {
        streamId: 'publisher',
        name: 'audio',
        disableAll: true,
        status: switchStatus,
      },
    });
  };

  const sendStatus = (evt, control, enabled) => {
    let stream = evt.stream || evt.target.stream;
    if (!stream) {
      return;
    }

    const id = stream.streamId;
    stream = subscriberStreams[id];
    const buttonInfo = !stream ? publisherButtons[control] : stream.buttons[control];
    buttonInfo.enabled = !!enabled;

    Utils.sendEvent(`roomController:${control}`, {
      id,
      reason: evt.reason,
      enabled: buttonInfo.enabled,
    });
  };

  const _subscriberHandlers = {
    videoDisabled(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video');
      sendVideoEvent(evt.target.stream);
    },
    videoEnabled(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video', true);
      sendVideoEvent(evt.target.stream);
    },
    disconnected(evt) {
      Utils.sendEvent('roomController:disconnected', {
        id: evt.target.stream.streamId,
      });
    },
    connected(evt) {
      Utils.sendEvent('roomController:connected', {
        id: evt.target.stream.streamId,
      });
    },
  };

  let _allHandlers = {
    connectionCreated() {
      RoomView.participantsNumber = ++numUsrsInRoom;
    },
    connectionDestroyed() {
      RoomView.participantsNumber = --numUsrsInRoom;
    },
    sessionConnected() {
      Utils.sendEvent('roomController:sessionConnected');
    },
    sessionDisconnected() {
      // The client has disconnected from the session.
      // This event may be dispatched asynchronously in response to a successful
      // call to the disconnect() method of the Session object.
      // The event may also be disptached if a session connection is lost
      // inadvertantly, as in the case of a lost network connection.
      numUsrsInRoom = 0;
      Utils.sendEvent('roomController:sessionDisconnected');
      subscriberStreams = {};
    },
    streamCreated(evt) {
      publisherReady.then(() => {
        // A new stream, published by another client, has been created on this
        // session. For streams published by your own client, the Publisher object
        // dispatches a streamCreated event. For a code example and more details,
        // see StreamEvent.
        const { stream } = evt;
        // SIP call streams have no video.
        const streamVideoType = stream.videoType || 'noVideo';

        let connectionData;
        try {
          connectionData = JSON.parse(stream.connection.data);
        } catch (error) {
          connectionData = {};
        }
        // Add an isSip flag to stream object
        stream.isSip = !!connectionData.sip;
        if (!stream.name) {
          stream.name = connectionData.name || '';
        }

        const { streamId } = stream;
        stream.phoneNumber = stream.isSip && stream.name;
        if (stream.isSip) {
          stream.name = 'Invited Participant';
        }

        subscriberStreams[streamId] = {
          stream,
          buttons: SubscriberButtons(streamVideoType, stream.phoneNumber),
        };

        const subOptions = subscriberOptions[streamVideoType];
        const enterWithVideoDisabled = streamVideoType === 'camera' && _disabledAllVideos;

        _sharedStatus = RoomStatus.get(STATUS_KEY);

        const subsDOMElem = RoomView.createStreamView(streamId, {
          name: stream.name,
          type: stream.videoType,
          controlElems: subscriberStreams[streamId].buttons,
        });

        subOptions.subscribeToVideo = !enterWithVideoDisabled;

        subscriberStreams[streamId].subscriberPromise = otHelper.subscribe(
          evt.stream, subsDOMElem, subOptions, {}, enableAnnotations,
        ).then((subscriber) => {
          if (streamVideoType === 'screen') {
            enableAnnotations && Utils.sendEvent('roomController:annotationStarted');
            const subContainer = subscriber.element.parentElement;
            Utils.sendEvent('layoutView:itemSelected', {
              item: subContainer,
            });
            return subscriber;
          }

          Object.keys(_subscriberHandlers).forEach((name) => {
            subscriber.on(name, _subscriberHandlers[name]);
          });
          if (enterWithVideoDisabled) {
            pushSubscriberButton(streamId, 'video', true);
          }

          new ResizeSensor(subsDOMElem, () => { // eslint-disable-line no-new
            const subsDimension = {
              width: subsDOMElem.clientWidth,
              height: subsDOMElem.clientHeight,
            };
            otHelper.setPreferredResolution(subscriber, null, subsDimension, null, null);
          });

          sendVideoEvent(evt.stream);
          return subscriber;
        }, (error) => {
          debug.error(`Error susbscribing new participant. ${error.message}`);
        });
      });
    },
    streamDestroyed(evt) {
      // A stream from another client has stopped publishing to the session.
      // The default behavior is that all Subscriber objects that are subscribed
      // to the stream are unsubscribed and removed from the HTML DOM. Each
      // Subscriber object dispatches a destroyed event when the element is
      // removed from the HTML DOM. If you call the preventDefault() method in
      // the event listener for the streamDestroyed event, the default behavior
      // is prevented and you can clean up Subscriber objects using your own
      // code. See Session.getSubscribersForStream().
      // For streams published by your own client, the Publisher object
      // dispatches a streamDestroyed event.
      // For a code example and more details, see StreamEvent.
      const { stream } = evt;
      if (stream.videoType === 'screen') {
        Utils.sendEvent('roomController:annotationEnded');
      }
      RoomView.deleteStreamView(stream.streamId);
      subscriberStreams[stream.streamId] = null;
    },
    streamPropertyChanged(evt) {
      if (otHelper.publisherId !== evt.stream.id) {
        return;
      }
      if (evt.changedProperty === 'hasVideo') {
        evt.reason = 'publishVideo';
        sendStatus(evt, 'video', evt.newValue);
      } else if (evt.changedProperty === 'hasAudio') {
        evt.reason = 'publishAudio';
        sendStatus(evt, 'audio', evt.newValue);
      }
    },
    archiveStarted(evt) {
      // Dispatched when an archive recording of the session starts
      Utils.sendEvent('archiving', {
        status: 'started',
        id: evt.id,
      });
    },
    archiveStopped() {
      // Dispatched when an archive recording of the session stops
      Utils.sendEvent('archiving', { status: 'stopped' });
    },
    'signal:roomLocked': function (evt) {
      const roomState = JSON.parse(evt.data).status;
      Utils.sendEvent('roomController:roomLocked', roomState);
    },
    'signal:muteAll': function (evt) {
      const statusData = JSON.parse(evt.data);
      const muteAllSwitch = statusData.status;
      const { onlyChangeSwitch } = statusData;
      // onlyChangeSwitch is true when the iOS app sends a false muteAll signal.
      if (onlyChangeSwitch) {
        return;
      }

      const setNewAudioStatus = ((isMuted) => {
        if (_sharedStatus.roomMuted !== isMuted) {
          return;
        }
        setAudioStatus(isMuted);
      }).bind(undefined, muteAllSwitch);

      if (!otHelper.isMyself(evt.from)) {
        _sharedStatus.roomMuted = muteAllSwitch;
        setAudioStatus(muteAllSwitch);
        Utils.sendEvent('roomController:roomMuted', { isJoining: false });
        RoomView.showConfirmChangeMicStatus(muteAllSwitch).then(setNewAudioStatus);
      }
    },
    'signal:archives': function (evt) {
      Utils.sendEvent('roomController:archiveUpdates', evt);
    },
    'signal:attentionScore': async function (evt) {
      const data = JSON.parse(evt.data);
      if (!otHelper.isMyself(evt.from)) {
        const subStreamContainer = (await subscriberStreams[data.streamId].subscriberPromise).element;
        console.log('attentionScore', data);

        LayoutManager.setAttentionUI(attentionMap(data.attention), subStreamContainer);
      } else {
        console.log('Is myself');
      }
    },
  };

  function showMobileShareUrl() {
    navigator.share({
      title: 'Invite Participant',
      url: location.href,
    })
      .then(() => { console.log('Successful share'); })
      .catch((error) => { console.log('Error sharing', error); });
  }

  function addClipBoardFeature(selector) {
    const inviteLinkBtn = document.getElementById('copyInviteLinkBtn');
    const inputElem = document.getElementById('current-url');
    if (inputElem && inputElem.textContent) {
      navigator.clipboard.writeText(inputElem.textContent.trim())
        .then(() => {
          if (inviteLinkBtn.innerText !== 'Copied!') {
            const originalText = inviteLinkBtn.innerText;
            inviteLinkBtn.innerText = 'Copied!';
            setTimeout(() => {
              Modal.hide(selector);
              inviteLinkBtn.innerText = originalText;
            }, 2000);
          }
        });
    }
  }

  function showAddToCallModal() {
    const selector = '.add-to-call-modal';
    return Modal.show(selector).then(() => new Promise((resolve) => {
      const copyButton = document.getElementById('copyInviteLinkBtn');
      const dialButton = document.getElementById('dialOutBtn');

      copyButton && copyButton.addEventListener('click', function onClicked(event) {
        event.preventDefault();
        copyButton.removeEventListener('click', onClicked);
        addClipBoardFeature(selector);
        resolve();
      });

      dialButton && dialButton.addEventListener('click', function onClicked(event) {
        event.preventDefault();
        dialButton.removeEventListener('click', onClicked);
        Modal.hide(selector);
        resolve();
      });
    }));
  }

  function getRoomParams() {
    if (!exports.RoomController) {
      throw new Error('Room Controller is not defined. Missing script tag?');
    }

    // pathName should be /room/<roomURI>[?username=<userName>]
    const pathName = document.location.pathname.split('/');

    if (!pathName || pathName.length < 2) {
      throw new Error('Invalid path');
    }

    let roomName = '';
    let roomURI = '';
    const { length } = pathName;
    if (length > 0) {
      roomURI = pathName[length - 1];
    }
    roomName = Utils.decodeStr(roomURI);

    // Recover user identifier
    const params = Utils.parseSearch(document.location.search);
    const usrId = window.userName || params.getFirstValue('userName');
    enableHangoutScroll = params.getFirstValue('enableHangoutScroll') !== undefined;

    return PrecallController.showCallSettingsPrompt(roomName, usrId, otHelper)
      .then((info) => {
        RoomView.showRoom();
        RoomView.roomURI = info.roomURI;
        publisherOptions.publishAudio = info.publisherOptions.publishAudio;
        publisherOptions.publishVideo = info.publisherOptions.publishVideo;
        publisherOptions.audioSource = info.publisherOptions.audioSource;
        publisherOptions.videoSource = info.publisherOptions.videoSource;
        return info;
      });
  }

  function getRoomInfo(aRoomParams) {
    return Request
      .getRoomInfo(aRoomParams)
      .then((aRoomInfo) => {
        if (!(aRoomInfo && aRoomInfo.token && aRoomInfo.sessionId
              && aRoomInfo.apiKey && aRoomInfo.username)) {
          debug.error('Error getRoomParams [', aRoomInfo,
            '] without correct response');
          throw new Error('Error getting room parameters');
        }
        aRoomInfo.roomURI = aRoomParams.roomURI;
        aRoomInfo.publishAudio = aRoomParams.publishAudio;
        aRoomInfo.publishVideo = aRoomParams.publishVideo;
        enableAnnotations = aRoomInfo.enableAnnotation;
        enableArchiveManager = aRoomInfo.enableArchiveManager;
        enableSip = aRoomInfo.enableSip;
        requireGoogleAuth = aRoomInfo.requireGoogleAuth;
        return aRoomInfo;
      });
  }

  const modules = [
    '/js/components/htmlElems.js',
    '/js/helpers/resolutionAlgorithms.js',
    '/js/itemsHandler.js',
    '/js/layoutView.js',
    '/js/layouts.js',
    '/js/min/layoutManager.min.js',
    '/js/roomView.js',
    '/js/roomStatus.js',
    '/js/min/chatController.min.js',
    '/js/min/recordingsController.min.js',
    '/js/min/precallController.min.js',
    '/js/layoutMenuController.js',
    '/js/min/screenShareController.min.js',
    '/js/min/feedbackController.min.js',
    '/js/googleAuth.js',
    '/js/min/phoneNumberController.min.js',
    '/js/vendor/ResizeSensor.js',
  ];

  const init = () => {
    LazyLoader.load(modules)
      .then(() => {
        Utils.addEventsHandlers('roomView:', viewEventHandlers, exports);
        Utils.addEventsHandlers('roomStatus:', roomStatusHandlers, exports);
        Utils.addEventsHandlers('precallView:', {
          submit() {
          // Jeff to do: The room logic should go here, not in PrecallController.
          },
        });

        return PrecallController.init();
      })
      .then(() => LazyLoader.load('/js/helpers/OTHelper.js'))
      .then(() => {
        otHelper = new OTHelper({});
        exports.otHelper = otHelper;
      })
      .then(getRoomParams)
      .then(getRoomInfo)
      .then((aParams) => {
        let loadAnnotations = Promise.resolve();
        if (enableAnnotations) {
          exports.OTKAnalytics = exports.OTKAnalytics
          || (() => ({
            addSessionInfo() {},
            logEvent(a, b) {
              console.log(a, b); // eslint-disable-line no-console
            },
          }));

          loadAnnotations = LazyLoader.load([
            'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js',
            '/js/vendor/opentok-annotation.js',
          ]);
        }
        return loadAnnotations.then(() => aParams);
      })
      .then((aParams) => {
        RoomView.init(enableHangoutScroll, enableArchiveManager, enableSip);
        // Init this controller before connect to the session
        // to start receiving signals about archives updates
        RecordingsController.init(enableArchiveManager, aParams.archives);

        roomURI = aParams.roomURI;
        userName = aParams.username ? aParams.username.substring(0, 1000) : '';
        userName = Utils.htmlEscape(userName.substring(0, 25));
        token = aParams.token;

        const sessionInfo = {
          apiKey: aParams.apiKey,
          sessionId: aParams.sessionId,
          token: aParams.token,
        };

        const connect = otHelper.connect.bind(otHelper, sessionInfo);

        const waitForConnectionCount = () => new Promise((resolve) => {
          if (!maxUsersPerRoom) {
            return resolve();
          }
          return setTimeout(() => {
            if (numUsrsInRoom > maxUsersPerRoom) {
              Utils.sendEvent('roomController:meetingFullError');
              return;
            }
            resolve();
          }, 500);
        });

        RoomView.participantsNumber = 0;

        _allHandlers = RoomStatus.init(_allHandlers, { room: _sharedStatus });

        if (enableSip && requireGoogleAuth) {
          GoogleAuth.init(aParams.googleId, aParams.googleHostedDomain, (aGoogleAuth) => {
            googleAuth = aGoogleAuth;
            if (googleAuth.isSignedIn.get()) {
              document.body.data('google-signed-in', 'true');
            }
          });
        }

        ChatController
          .init(userName, _allHandlers)
          .then(connect)
          .then(LayoutMenuController.init)
          .then(waitForConnectionCount)
          .then(() => {
            const publisherElement = RoomView.createStreamView('publisher', {
              name: userName,
              type: 'publisher',
            });
            console.log('HERRRREEE');
            // If we have all audios disabled, we need to set the button status
            // and don't publish audio
            if (_sharedStatus.roomMuted) {
            // Set visual status of button
              sendStatus({
                stream: {
                  streamId: 'Publisher',
                },
                reason: 'publishAudio',
              }, 'audio', false);
              // Don't publish audio
              publisherOptions.publishAudio = false;
            }
            publisherOptions.name = userName;

            return otHelper.publish(publisherElement, publisherOptions, {}).then(async (publisher) => {
              streamId = publisher.stream.id;
              console.log('Publisher', publisher);
              console.log('Publisher elementt', publisherElement.querySelector('video'));
              const webcam = publisherElement.querySelector('video');
              await runFacemesh(webcam);
              setPublisherReady();
              RoomView.showPublisherButtons(publisherOptions);
            }).catch((errInfo) => {
              console.log('Err info', errInfo);
              if (errInfo.error.name === 'OT_CHROME_MICROPHONE_ACQUISITION_ERROR') {
                Utils.sendEvent('roomController:chromePublisherError');
                otHelper.disconnect();
              }
            });
          })
          .then(() => {
            ScreenShareController.init(userName, aParams.chromeExtId, otHelper, enableAnnotations);
            FeedbackController.init(otHelper, aParams.reportIssueLevel);
            PhoneNumberController.init();
            Utils.sendEvent('roomController:controllersReady');
          })
          .catch((error) => {
            debug.error(`Error Connecting to room. ${error.message}`);
          });
      });
  };

  const RoomController = {
    init,
  };

  exports.RoomController = RoomController;
})(this);
