'use client';

import type { CreateFootballerRequest, Footballer, FootballerNation } from '@/types/player';
import { Edit, Loader2, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { NationsMultiSelect } from '@/components/footballer-management/NationsMultiSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

/**
 * The footballer edit form.
 *
 * Built on `react-hook-form` rather than a `useState` object lifted into the
 * page. That is not tidiness: the old shape validated on submit in the page's
 * handler and reported "Last name is required" as a page-level alert above the
 * form, which does not say which field, does not focus it, and scrolls away
 * from the input it is about. Field rules with `FormMessage` put the message on
 * the control that failed, which is what the Django admin does and the reason
 * the admin is easier to use than this page was.
 *
 * `components/ui/form.tsx` has been in the repo since the scaffold, importing a
 * library that was never a runtime dependency and used by nothing. It is used
 * now, and `react-hook-form` moved from `devDependencies` to `dependencies`
 * where it belongs — importing it at runtime from a dev dependency is a deploy
 * that works only because Vercel installs both.
 *
 * Grouped into the same tabs the admin uses — profile, then game availability —
 * because the two are edited on different occasions: names and dates when a
 * footballer is added, availability and difficulty when content is tuned.
 * One long scroll made the second job hunt through the first.
 */

/** A panel that lives beside the form's own two, in the same tab row. */
export type EditorTab = {
  value: string;
  label: string;
  content: React.ReactNode;
};

type UpdateFootballerProps = {
  updateForm: CreateFootballerRequest;
  updateLoading: boolean;
  nations: FootballerNation[];
  nationsLoading: boolean;
  footballerToUpdate: Footballer | null;
  fetchLoading: boolean;
  footballerId: string;
  /** Called with the validated values — the form owns them, not the page. */
  onUpdateFootballer: (values: CreateFootballerRequest) => void;
  onFootballerIdChange: (id: string) => void;
  onFetchFootballerForUpdate: () => void;
  /**
   * The related-model editors and the Career Path record, as peers of the
   * form's own tabs rather than a stack of cards below it.
   *
   * They sit OUTSIDE the `<form>` element deliberately: each one saves itself
   * against its own endpoint, and a save button inside a form submits that form
   * whether or not anyone meant it to.
   */
  extraTabs?: EditorTab[];
  /** Controlled so a deep link can open straight onto one of them. */
  tab?: string;
  onTabChange?: (tab: string) => void;
};

/** Stable identity: a fresh `[]` default would be a new prop on every render. */
const NO_EXTRA_TABS: EditorTab[] = [];

/** A labelled switch, which is most of the second tab. */
function SwitchField({ form, name, label, description }: {
  form: ReturnType<typeof useForm<CreateFootballerRequest>>;
  name: keyof CreateFootballerRequest;
  label: string;
  description?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel className="text-sm">{label}</FormLabel>
            {description && <FormDescription className="text-xs">{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function UpdateFootballer({
  updateForm,
  updateLoading,
  nations,
  footballerToUpdate,
  fetchLoading,
  footballerId,
  onUpdateFootballer,
  onFootballerIdChange,
  onFetchFootballerForUpdate,
  extraTabs = NO_EXTRA_TABS,
  tab,
  onTabChange,
}: UpdateFootballerProps) {
  // `values` rather than `defaultValues`: the page fills `updateForm` when a
  // footballer is fetched, which happens after this component has mounted, and
  // `defaultValues` is read once. Loading a second footballer without this
  // leaves the first one's data in the fields.
  const form = useForm<CreateFootballerRequest>({ values: updateForm, mode: 'onBlur' });

  // Controlled when the page supplies it — a deep link opens straight onto the
  // Career Path panel — and self-owned otherwise.
  const [internalTab, setInternalTab] = useState('profile');
  const current = tab ?? internalTab;
  const change = (next: string) => {
    setInternalTab(next);
    onTabChange?.(next);
  };
  // The submit button belongs to the form's two panels, not to the editors.
  const onForm = current === 'profile' || current === 'availability';

  // Resolve other_nation_ids → Nation objects for the multi-select chip
  // renderer. Falls back gracefully when ``nations`` is still loading.
  const otherNationIds = form.watch('other_nation_ids');
  const otherNations = useMemo(() => {
    return (otherNationIds ?? [])
      .map(id => nations.find(n => n.id === id))
      .filter((n): n is FootballerNation => Boolean(n));
  }, [otherNationIds, nations]);

  return (
    <div className="space-y-6">
      {/* Step 1: Fetch Footballer to Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Step 1: Load Footballer to Update
          </CardTitle>
          <CardDescription>
            First, fetch the footballer you want to update to populate the form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="update-footballer-id" className="text-sm font-medium">Footballer ID</label>
            <Input
              id="update-footballer-id"
              type="number"
              placeholder="Enter footballer ID to update"
              value={footballerId}
              onChange={e => onFootballerIdChange(e.target.value)}
              disabled={fetchLoading}
            />
          </div>

          <ApiButton
            onClick={onFetchFootballerForUpdate}
            disabled={!footballerId.trim()}
            loading={fetchLoading}
            loadingText="Loading footballer..."
            icon={Search}
          >
            Load Footballer Data
          </ApiButton>

          {footballerToUpdate && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {`✅ Loaded: ${footballerToUpdate.first_name} ${footballerToUpdate.last_name} (ID: ${footballerToUpdate.id})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {footballerToUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="size-5" />
              Step 2: Update Footballer Details
            </CardTitle>
            <CardDescription>
              {`PUT /data/footballers/${footballerToUpdate.id}/ — modify the footballer information below`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={current} onValueChange={change}>
              {/* Wrapping rather than an N-column grid: the tab count grows
                  with the related-model editors, and a grid would shrink every
                  label until none of them read. */}
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="availability">Game availability</TabsTrigger>
                {extraTabs.map(extra => (
                  <TabsTrigger key={extra.value} value={extra.value}>{extra.label}</TabsTrigger>
                ))}
              </TabsList>

              {/* Only the two form panels are inside the <form>. The editors
                  below save themselves against their own endpoints, and a save
                  button inside a form submits that form whether or not anyone
                  meant it to. */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onUpdateFootballer)} noValidate>
                  <TabsContent value="profile" className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AWAITING_REVISION">Awaiting Revision</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="DENIED">Denied</SelectItem>
                                <SelectItem value="AWAITING_CHANGE_CHECK">Awaiting Change Check</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="career_path_difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Career difficulty</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="EASY">Easy</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="HARD">Hard</SelectItem>
                                <SelectItem value="EXTREME">Extreme</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                              The grading the Career Path analytics reads against what players actually did.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input
                                name={field.name}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value ?? ''}
                                placeholder="First name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        rules={{
                          required: 'Last name is required',
                          validate: value => value.trim().length > 0 || 'Last name is required',
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last name *</FormLabel>
                            <FormControl>
                              <Input
                                name={field.name}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value ?? ''}
                                placeholder="Last name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date_of_birth"
                        rules={{ required: 'Date of birth is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of birth *</FormLabel>
                            <FormControl>
                              <Input
                                name={field.name}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value ?? ''}
                                type="date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nation_id"
                        rules={{ required: 'Nation is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nation *</FormLabel>
                            <FormControl>
                              <NationCombobox
                                value={field.value ?? null}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="other_nation_ids"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other nations</FormLabel>
                          <FormControl>
                            <NationsMultiSelect
                              value={otherNations}
                              onChange={next => field.onChange(next.map(nation => nation.id))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wikipedia_url"
                      rules={{
                        validate: value =>
                          !value || /^https?:\/\//i.test(value) || 'Must start with http:// or https://',
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wikipedia URL</FormLabel>
                          <FormControl>
                            <Input
                              name={field.name}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value || null)}
                              placeholder="https://en.wikipedia.org/wiki/..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additional_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional info</FormLabel>
                          <FormControl>
                            <Textarea
                              name={field.name}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value || null)}
                              rows={3}
                              placeholder="Anything an editor should know about this footballer"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SwitchField form={form} name="retired" label="Retired" />
                      <SwitchField form={form} name="is_player" label="Is player" />
                      <SwitchField form={form} name="is_manager" label="Is manager" />
                      <SwitchField
                        form={form}
                        name="might_change"
                        label="Might change"
                        description="Flagged for re-checking later."
                      />
                      <SwitchField
                        form={form}
                        name="show_date_of_birth_on_search"
                        label="Show date of birth in search"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="availability" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Which games may use this footballer. Turning one off removes them from new
                      content in that game; it does not touch content already generated.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SwitchField form={form} name="available_for_career_path" label="Career Path" />
                      <SwitchField form={form} name="available_for_grid" label="Grid" />
                      <SwitchField form={form} name="available_for_scout" label="Scout" />
                    </div>
                  </TabsContent>

                  {onForm && (
                    <div className="mt-5 flex justify-end">
                      <ApiButton type="submit" loading={updateLoading} loadingText="Updating..." icon={Edit}>
                        Update Footballer
                      </ApiButton>
                    </div>
                  )}
                </form>
              </Form>

              {extraTabs.map(extra => (
                <TabsContent key={extra.value} value={extra.value} className="mt-4">
                  {extra.content}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
      {updateLoading && <Loader2 className="sr-only animate-spin" aria-hidden />}
    </div>
  );
}
