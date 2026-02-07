import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const profileSchema = z.object({ email: z.string().email("Invalid email") });
const passwordSchema = z.object({
  current_password: z.string().min(1, "Required"),
  new_password: z.string().min(8, "At least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, { message: "Passwords must match", path: ["confirm_password"] });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: user?.email ?? "" },
  });
  useEffect(() => {
    if (user?.email) profileForm.reset({ email: user.email });
  }, [user?.email, profileForm]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await api.patch("/api/users/me/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Profile updated");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || "Update failed");
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      await api.post("/api/users/me/change-password/", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      setShowPasswordForm(false);
      toast.success("Password updated");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || "Password change failed");
    },
  });

  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<{ addresses: Array<{
        id: number;
        full_name: string;
        address_line1: string;
        city: string;
        state: string;
        zip_code: string;
        country: string;
      }> }>("/api/users/me/addresses/");
      return data;
    },
  });

  const addresses = addressesData?.addresses ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-8"
    >
      <h1 className="font-heading text-3xl font-bold">Account</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Profile</h2>
          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...profileForm.register("email")}
              />
              {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Password</h2>
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change password
            </Button>
          ) : (
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit((data) => changePassword.mutate(data))}
            >
              <div className="space-y-2">
                <Label htmlFor="current_password">Current password</Label>
                <Input
                  id="current_password"
                  type="password"
                  {...passwordForm.register("current_password")}
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.current_password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New password</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...passwordForm.register("new_password")}
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm new password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...passwordForm.register("confirm_password")}
                />
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? "Updating…" : "Update password"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Addresses</h2>
          <p className="text-sm text-muted-foreground">Manage your shipping addresses. You can add and edit them at checkout.</p>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground">No saved addresses.</p>
          ) : (
            <ul className="space-y-3">
              {addresses.map((addr) => (
                <li key={addr.id} className="border rounded-lg p-4 text-sm">
                  <p className="font-medium">{addr.full_name}</p>
                  <p>{addr.address_line1}</p>
                  <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                  <p>{addr.country}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
