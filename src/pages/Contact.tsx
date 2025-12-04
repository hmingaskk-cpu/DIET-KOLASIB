"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";

const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }).max(500, {
    message: "Message cannot exceed 500 characters.",
  }),
});

const Contact = () => {
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof contactFormSchema>) => {
    console.log("Contact form submitted:", values);
    showSuccess("Your message has been sent successfully!");
    form.reset();
  };

  return (
    <div className="px-0 py-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-deep-blue px-4">Contact Us</h1>
      <p className="text-xl text-gray-700 mb-6 text-center max-w-2xl px-4">
        We'd love to hear from you! Please fill out the form below or reach out to us directly.
      </p>

      <Card className="w-full max-w-lg rounded-none sm:rounded-lg">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-deep-blue">Send us a Message</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type your message here..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-app-green text-white hover:bg-app-green/90">Send Message</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center px-4">
        <h2 className="text-2xl font-semibold mb-2 text-deep-blue">Our Location</h2>
        <p className="text-gray-700">
          DIET KOLASIB, Saidan, Kolasib, Mizoram - 796081
        </p>
        <p className="text-gray-700">
          Phone: +91 8974543880 | Email: dietkolasib@gmail.com
        </p>
        <p className="text-gray-700">
          Website: <a href="https://www.dietkolasib.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.dietkolasib.com</a>
        </p>
      </div>
    </div>
  );
};

export default Contact;